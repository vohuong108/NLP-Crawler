const { queryDetail } = require('./helper');
const ListId = require('./models/ListId');
const moment = require("moment-timezone");
const DetailVideo = require('./models/DetailVideo');
const LIST_API = require('./api');
const base_detail_url = "https://youtube.googleapis.com/youtube/v3/videos";


const getListBatchVideoId = async (index) => {
    
    for(let i = 0; i < 3; i += 1) {
        try {
            let filter = {};
            if(!index) {
                let current_detail_index = await DetailVideo.findOne({}, ['_id', 'parentIndex'], {sort: {index: -1}});
                console.log("[INDEX NULL] current_detail_index: ", current_detail_index)
                if (current_detail_index) {
                    filter = { index: {$gt: current_detail_index.parentIndex} }
                } else {
                    filter = {}
                }
            } else {
                filter = { index: {$gt: index} }
            }
            
            let projection = ['_id', 'videoIds', 'index'];
            let option = { sort: {index: 1}};
            console.log("FILTER GET BATCH: ", filter);

            let result = await ListId.findOne(filter, projection, option);
            console.log("GET LIST BATCH SUCCESSFUL WITH ID: ", result?._id, " INDEX: ", result?.index);

            return result;
        } catch (err) {
            console.error("ERROR IN LIST BATCH: ", err);
            console.log("=>>>>> Replay ", i, "times");
            
            if(i === 2) return "FAILED GET LIST BATCH";
        }
        await new Promise((resolve, _) => setTimeout(resolve, 1000));
    }
}

const handleUpdateVideoDetail = async (list_details) => {
    for(let i = 0; i < 3; i += 1) {
        try {
            let res = await DetailVideo.insertMany(list_details, {ordered: false});
            
            console.log("INPUT LENGTH: ", list_details.length, "SAVED VIDEO DETAILS WITH: ", res?.length, "\n");

            return "UPDATED VIDEO DETAIL";
        } catch (err) {
            if(err?.code === 11000) {
                console.error("ERROR IN UPDATE VIDEO DETAIL: ", err?.code);
                console.log(`[DUPLICATE VIDEO DETAIL] ADDED SUCCESSFUL = ${list_details?.length} - ${err?.writeErrors.length} = ${list_details?.length - err?.writeErrors.length}\n`);
                return "SAVE VIDEO DETAIL WITH DUPLICATE";
            }

            console.error("[DATABASE] ERROR IN UPDATE VIDEO DETAIL: ", err);
            console.log("=>>>>> Replay ", i, "times");

            if(i === 2) return "FAILED UPDATE VIDEO DETAIL";
        }
        await new Promise((resolve, _) => setTimeout(resolve, 1000));
    }
}

const handleCrawlVideoDetail = async (index_api) => {
    if(index_api >= LIST_API.length) {
        return "EXCEED LIST API";
    }
    
    let part = ['snippet', 'contentDetails', 'statistics', 'topicDetails'];
    let maxResults = 50;
    let batchIndex = null;
    let API_KEY = LIST_API[index_api];

    while (true) {
        let batchItem = await getListBatchVideoId(batchIndex);
        console.log("BATCH ITEM: ", batchItem);

        if(!batchItem) { return "FULLED DETAIL"; }
        else {
            batchIndex = batchItem.index;
            let list_ids = batchItem.videoIds.map(item => item);
            let batchId = batchItem._id;

            let query_response = await queryDetail(base_detail_url, part, list_ids, maxResults, API_KEY)

            if(query_response === "QUERY QUOTA EXCEED") return "QUERY QUOTA EXCEED";
            else if(query_response !== "FAILED QUERY DETAIL" && query_response.items.length > 0) {

                console.log("LENGTH RESPONSE QUERY: " + query_response.items.length);

                let list_video_details = query_response.items.map(item => ({
                    parentId: batchId,
                    videoId: item.id,
                    parentIndex: batchIndex,
                    content: item
                }))

                let respone_update = await handleUpdateVideoDetail(list_video_details);

                if(respone_update === "FAILED UPDATE VIDEO DETAIL") {
                    return "FAILED UPDATE VIDEO DETAIL"
                }
                await new Promise((resolve, _) => setTimeout(resolve, 1500));

            }

        }
    }
}

module.exports = {handleCrawlVideoDetail}
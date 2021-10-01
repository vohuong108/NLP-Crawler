const { queryDetail } = require('./helper');
const ListId = require('./models/ListId');
const ListComment = require('./models/ListComment');
const moment = require("moment-timezone");
const DetailVideo = require('./models/DetailVideo');
const LIST_API = require('./api');
const mongoose = require('mongoose');
const base_detail_url = "https://youtube.googleapis.com/youtube/v3/videos";


const getListBatchVideoId = async (index) => {
    //TODO: re-run 3 times when fail occur
    for(let i = 0; i < 3; i += 1) {
        try {
            let filter = index !== null ? { index: {$gt: index} } : {};
            let projection = ['_id', 'videoIds', 'index'];
            let option = { sort: {index: 1}};
            console.log("FILTER: ", filter);

            let result = await ListId.findOne(filter, projection, option);
            console.log("GET LIST BATCH SUCCESSFUL WITH ID: ", result?._id);

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
            console.log("SAVED VIDEO DETAILS WITH: ", list_details.length, "\n");

            return "UPDATED VIDEO DETAIL";
        } catch (err) {
            if(err?.code === 11000) {
                console.error("ERROR IN UPDATE VIDEO DETAIL: ", err?.code);
                console.log(`ADDED SUCCESSFUL = ${list_details?.length} - ${err?.writeErrors.length} = ${list_details?.length - err?.writeErrors.length}\n`);
                return "SAVE VIDEO DETAIL WITH DUPLICATE";
            }

            console.error("ERROR IN UPDATE VIDEO DETAIL: ", err);
            console.log("=>>>>> Replay ", i, "times");

            
            
            if(i === 2) return "FAILED UPDATE VIDEO DETAIL";
        }
        await new Promise((resolve, _) => setTimeout(resolve, 1000));
    }
}

const handleCrawlVideoDetail = async (index_api) => {
    let part = ['snippet', 'contentDetails', 'statistics'];
    let maxResults = 50;
    let indexBatch = null;
    let API_KEY = LIST_API[index_api];

    while (true) {
        let batchItem = await getListBatchVideoId(indexBatch);
        console.log("BATCH ITEM: ", batchItem);

        if(!batchItem) { return "FULLED DETAIL"; }
        else {
            indexBatch = batchItem.index;
            let list_ids = batchItem.videoIds.map(item => item);
            let batchId = batchItem._id;

            let query_response = await queryDetail(base_detail_url, part, list_ids, maxResults, API_KEY)

            if(query_response === "QUERY QUOTA EXCEED") return "QUERY QUOTA EXCEED";
            else if(query_response !== "FAILED QUERY DETAIL" && query_response.items.length > 0) {

                console.log("IN RESPONSE QUERY: " + query_response.items.length);

                let list_video_details = query_response.items.map(item => ({
                    parentId: batchId,
                    videoId: item.id,
                    title: item.snippet.title,
                    description: item.snippet.description,
                    publishedAt: new Date(item.snippet.publishedAt),
                    publisher: item.snippet.channelTitle,
                    duration: moment.duration(item.contentDetails.duration).asSeconds(),
                    numOfView: item.statistics.viewCount,
                    numOfLike: item.statistics.likeCount,
                    numOfDislike: item.statistics.dislikeCount,
                    url: "https://www.youtube.com/watch?v=" + item.id,
                    tags: item.snippet.tags,
                    categoryId: parseInt(item.snippet.categoryId),
                    other: item
                }))

                let respone_update = await handleUpdateVideoDetail(list_video_details);
                await new Promise((resolve, _) => setTimeout(resolve, 1500));

            }

        }
    }
}

module.exports = {handleCrawlVideoDetail}
const ListComment = require('./models/ListComment');
const ListId = require('./models/ListId');
const {queryVideoId, queryComment} = require('./helper');
const mongoose = require('mongoose');
const LIST_API = require("./api");
const LIST_REGION_CODE = require("./regionCode");

const base_search_url = "https://youtube.googleapis.com/youtube/v3/search";
const base_cmt_url = "https://youtube.googleapis.com/youtube/v3/commentThreads";
// const API_KEY = "AIzaSyCM2zo3xCPcW23oQAPBPkUe08WzuKFhhzs";
// const API_KEY = "AIzaSyBEoXFRdY-pNXuhCwf-83KRH4RO8depHLU";
const API_KEY = "AIzaSyA5DcsV-8NayNtZCDME6z2uc-VY2C4Wy6o"; // Chi Huong
// const API_KEY = "AIzaSyDT5ZKc0uSWocxiQ6nDV0qKKPwCor0rni8"; //hai
// const API_KEY = "AIzaSyCIIl8Ulk5m0bJvRg1xsD-x8c6-8Gqge0A"; //hoa
// const API_KEY = "AIzaSyCVX_MJ2M5Rw2aFljrCA5apPZWy1re5fOE"; //iris
// const API_KEY = "AIzaSyBjYe5ADqEVIYn0h47StDN059gTERQ1zI4"; //ytb





const handleCrawlCommentById = async (batchId, videoId, nextPage, amount) => {
    console.log("AMOUNT: ", amount)
    let part = ['snippet', 'replies'];
    let maxResults = 100;
    let order = 'time';
    let textFormat = 'plainText';
    let amountFetched = amount;
    let nextPageToken = nextPage;
     

    while(true) {
        
        let responeQuery = await queryComment(base_cmt_url, part, maxResults, order, textFormat, videoId, API_KEY, nextPageToken);
        
        if(responeQuery === "QUERY QUOTA EXCEED") return "CRAWL QUOTA EXCEED";
        else if(responeQuery === "COMMENT DISABLED" || responeQuery === "VIDEO NOT FOUND") return "FULLED CRAWL";
        else if(responeQuery !== "FAILED QUERY") {
            
            if(responeQuery?.items?.length > 0) {
                nextPageToken = responeQuery.nextPageToken;
                amountFetched = responeQuery.items.length + amountFetched;
                console.log(">>>>>Fetched comments: ", amountFetched);

                let listComments = responeQuery.items.map(item => ({
                    topLevelComment: {
                        id: item.snippet.topLevelComment.id,
                        content: item.snippet.topLevelComment.snippet.textOriginal,
                        author: item.snippet.topLevelComment.snippet.authorDisplayName,
                        likeCount: item.snippet.topLevelComment.snippet.likeCount,
                        totalReplyCount: item.snippet.totalReplyCount,
                        isPublic: item.snippet.isPublic,
                    },
                    replies: item?.replies?.comments.map(reply => ({
                        id: reply.id,
                        content: reply.snippet.textOriginal,
                        author: reply.snippet.authorDisplayName,
                        likeCount: reply.snippet.likeCount,
                    }))
                }));

                let responeUpdateData = await handleUpdateCommentData(batchId, videoId, listComments, amountFetched, nextPageToken);

                if (responeUpdateData !== "FAILED UPDATE DATA") console.log("=>>>>> Saved ", amountFetched, "comments");
                else return "FAILED CRAWL";

                if (!nextPageToken) { return "FULLED CRAWL" }
                await new Promise((resolve, _) => setTimeout(resolve, 1500));
            }
            else return "FULLED CRAWL";

        } else {
            //TODO: Handle connect, capacity
            return "FAILED CRAWL";
        }
      
    }
}

const handleUpdateCommentData = async (batchId, videoId, listComments, amountFetched, nextPage) => {
    //TODO: re-run 3 times when fail occur
    for(let i = 0; i < 3; i+=1) {
        try {
            await ListComment.findOneAndUpdate(
                {parentId: batchId, videoId: videoId},
                {$push: {comments: listComments}, amountFetched: amountFetched, nextPage: nextPage ? nextPage : ""},
                {upsert: true, useFindAndModify: false}
    
            )
            
            console.log("SAVED COMMENT WITH: ", nextPage);
            return "UPDATED DATA";
        } catch (err) {
            console.error("ERROR IN UPDATE COMMENT DATA: ", err);
            console.log("=>>>>> Replay ", i, "times");
            
            if(i === 2) return "FAILED UPDATE DATA";
        }

        await new Promise((resolve, _) => setTimeout(resolve, 1000));
    }
}


//FIND one batch with state field is "READY"
const getBatchReady = async (index) => {
    //TODO: re-run 3 times when fail occur
    console.log("BATCH READY INDEX: ", index);
    for(let i = 0; i < 3; i += 1) {
        try {
            let filter = index !== null ? { state: 'READY', index: {$gt: index} } : { state: 'READY' };
            let projection = ['_id', 'videoIds', 'state', 'index'];
            let option = { sort: {index: 1}};
            console.log("FILTER BATCH READY: ", filter);

            let result = await ListId.findOne(filter, projection, option);
            console.log("===>GET BATCH READY SUCCESSFUL: ", result?._id);

            if(result?._id) return {
                ...result._doc,
                _id: result?._id?.toString(),
            }
            else return result;
        } catch (err) {
            console.error("################################ERROR IN GET READY: ", err);
            console.log("===>> Replay ", i, "times");
            
            if(i === 2) return "FAILED GET BATCH READY";
        }
        await new Promise((resolve, _) => setTimeout(resolve, 1000));
    }
}

//FIND list videoId in ListComment model that don't have {nextPage: null, amountFetched > 0}
const getListVideoNewCrawl = async (batchId) => {
    
    for (let i = 0; i < 3; i +=1 ) {
        try {
            let filter = { parentId: batchId, $or: [
                {$and: [{amountFetched: {$gt: 0}}, {nextPage: {$ne: ""}}]},
                {$and: [{amountFetched: 0}, {nextPage: ""}]}
            ]}
            let projection = ['videoId', 'nextPage', 'amountFetched'];
            console.log("FILTER LIST READY: ", filter);
            let items = await ListComment.find(filter, projection);
            
            console.log("===>>GET LIST NEW CRAWL SUCCESS: ", items?.length);
            console.log("LIST NEW CRAWL: ", items?.map(i => `${i.videoId} - ${i?.amountFetched}`));
            
            return items;
        } catch (err) {
            console.error("################################ERROR IN GET LIST VIDEO READY BY BATCH ID", err); 
            console.log("===>>> Replay ", i, "times");
            if(i === 2) return {state: "ERROR GET BY BATCH ID" };
            
        }
        await new Promise((resolve, _) => setTimeout(resolve, 1000));
    }
}

//UPDATE the state of batch (a document of ListId collection)
// 3 state: READY ===> RETRY ===> DONE
// READY = {nextPage: null, amountFetched: 0}
// RETRY = {nextPage: string, amountFetched: >0}
// DONE = {nextPage: null, amountFetched: >0}
const handleUpdateBatchState = async (batchId, newState) => {
    //TODO: re-run 3 times when fail occur
    for(let i = 0; i < 3; i += 1) {
        try {
            let id = mongoose.Types.ObjectId(batchId);
            let newUpdate = {state: newState}
            
            await ListId.findOneAndUpdate({_id: id}, {$set: newUpdate}, {timestamps: true, new: true, useFindAndModify: false});
            console.log("UPDATED BATCH STATE SUCCESSFUL: ", batchId);
            return "UPDATED BATCH STATE";
        } catch (err) {
            console.error("################################ERROR IN UPDATE BATCH STATE: ", err);
            console.log("=>>>>> Replay ", i, "times");
            
            if(i === 2) return "FAILED UPDATE BATCH STATE";
        }
        await new Promise((resolve, _) => setTimeout(resolve, 1000));
    }
}

//CRAWL the comments of list VideoIds in batch (state field is "READY")
const handleNewCrawl = async () => {
    let indexBatch = null;

    while (true) {
        let readyBatch = await getBatchReady(indexBatch);

        if(!readyBatch) { return "FULLED BATCH"; }
        else if (readyBatch !== "FAILED GET BATCH READY") {
            indexBatch = readyBatch.index;
            
            let batchId = readyBatch._id;
            let resultList = await getListVideoNewCrawl(batchId);

            if(resultList !== "ERROR GET BY BATCH ID") {
                if(!resultList || resultList.length === 0) {
                    //MEANT: crawled full comment in this batch
                    //TODO: update state batch -> DONE
                    //TODO: handle update state can fail -> re-run 3 times
                    await handleUpdateBatchState(batchId, "DONE");
                } else {
                    let isError = false;
    
                    for(item of resultList) {
                        console.log("===>>>>>>START CRAWL NEW IN: ", item.videoId);
                        let responeNewCrawl = await handleCrawlCommentById(batchId, item.videoId, item.nextPage, item.amountFetched);
                        console.log("===>>>>>>>>END CRAWL NEW WITH: ", responeNewCrawl, "\n");

                        if(responeNewCrawl === "CRAWL QUOTA EXCEED") {
                            await handleUpdateBatchState(batchId, "RETRY");
                            return responeNewCrawl;
                        }
                        else if(responeNewCrawl !== "FULLED CRAWL") {
                            isError = true;
                        }
                        await new Promise((resolve, _) => setTimeout(resolve, 1000));
                    }
    
                    if(!isError) {
                        //MEANT: crawled full comment in this batch 
                        //TODO: update state batch -> DONE
                        //TODO: handle update state can fail -> re-run 3 times -> ready or retry
                        await handleUpdateBatchState(batchId, "DONE");
                    } else {
                        //TODO: update state batch -> Retry
                        //TODO: handle update state can fail -> re-run 3 times -> still ready
                        await handleUpdateBatchState(batchId, "RETRY");
                    }
                }
            }


        }
        else return "FAILED GET BATCH READY";
    }

    

    

}



const getNextPageCrawlVideoId = async () => {
    for (let i = 0; i < 3; i += 1) {
        try {
            let result = await ListId.findOne({}, ["nextPage", "index", "keywords", "regionCode"], { sort: {"_id": -1}})
            
            if(result) {
                return { index: result.index, nextPage: result.nextPage, keywords: result.keywords, regionCode: result.regionCode };
            }
            else return {
                index: -1,
                nextPage: "",
                keywords: [],
                regionCode: "",
            };
        } catch (err) {
            console.log("[DATABSE] ERROR IN GET NEXTPAGE CRAWL ID", err);
            console.log("===>>>Replay ", i, "times");

            if(i === 2) return "FAILED GET NEXTPAGE";
        }
        await new Promise((resolve, _) => setTimeout(resolve, 1000));
    }
}

//Save the list videoId found to mongooDB cloud
const handleUpdateListData = async (list, keywords, totalOfVideo, nextPage, index, regionCode) => {
    for(let i= 0; i < 3; i += 1) {
        try {
            let resDocument = await ListId.create({
                videoIds: list, 
                keywords: keywords,
                totalOfVideo: totalOfVideo,
                nextPage: nextPage ? nextPage : "",
                state: "READY",
                index: index,
                regionCode: regionCode,
            })

            console.log("SAVED ID SUCCESSFUL IN: ", index, " SIZE: ", resDocument?.videoIds?.length);

            return resDocument;
        } catch (err) {
            console.error("===================>ERROR IN UPDATE LIST DATA: ", err);
            console.log("=>>>>> Replay ", i, "times");

            if(i === 2) return "FAILED UPDATE LIST DATA";
        }
        await new Promise((resolve, _) => setTimeout(resolve, 1000));
    }
}

//Initialize a record(document) corresponding to the videIds found
//Each record have {comments: [], nextPage: ""}
const initializeCommentList = async (parentId, listId) => {
    
    let edited_list_id = listId?.map(item => ({
        parentId: parentId,
        videoId: item.videoId,
        comments: [],
        amountFetched: 0,
        nextPage: "",
    }));

    for(let i = 0; i < 3; i += 1) {
        try {
            let res = await ListComment.insertMany(edited_list_id, {ordered: false});
            console.log("ADDED TO INITIAL COMMENT LIST: ", parentId, " SIZE: ", res?.length, "\n");

            return "INITED LIST COMMENT";

        } catch (err) {
            console.error("===================>ERROR IN INITIAL COMMENT: ", parentId, " SIZE: ", listId?.length);
            console.log("ERROR: ", err?.code);

            if(err?.code === 11000) {
                console.log(`ADDED SUCCESSFUL = ${listId?.length} - ${err?.writeErrors.length} = ${listId?.length - err?.writeErrors.length}\n`);
                return "INITED LIST COMMENT WITH DUPLICATE";
            }
            
            console.log("===>>>REPLAY ", i, "times");
            if(i === 2) return "FAILED INITIAL COMMENT LIST";
        }
        await new Promise((resolve, _) => setTimeout(resolve, 1000));
    }
}

//CRAWL list videoId with keywords
const handleCrawlVideoID = async (index_api) => {
    let part="snippet";
    let query = ["machine learning", "robotics", "artificial intelligence"];
    let keyword = "";  
    let relevanceLanguage = "en";
    let listRegionCode = LIST_REGION_CODE;
    let SELECTED_API_KEY = LIST_API[index_api];
    let regionCode = "";
    let type = "video";
    let maxResults = 50;
    let nextPageToken = "";
    let indexDocument = 0;
    
    let result_nextPage = await getNextPageCrawlVideoId();

    if(result_nextPage !== "FAILED GET NEXTPAGE") {
        console.log("GET NEXTPAGE CRAWL VIDEOID SUCCESSFUL: ", result_nextPage);

        if(result_nextPage.index > 0 && result_nextPage.nextPage === "") {
            let i_key = query.findIndex(item => item === result_nextPage.keywords[0]);
            let i_code = listRegionCode.findIndex(item => item === result_nextPage.regionCode);
            console.log("i_key: ", i_key, "i_code: ", i_code);

            if(i_key === query.length - 1 && i_code === listRegionCode.length - 1) return "FULLED CRAWL ALL KEYWORD";
            else if(i_key === query.length - 1 && i_code < listRegionCode.length - 1) {
                regionCode = listRegionCode[i_code + 1];
                keyword = query[0];
            }
            else if(i_key < query.length - 1) {
                regionCode = result_nextPage.regionCode;
                keyword = query[i_key + 1];
            }
            
        }
        else if(result_nextPage.index > 0 && result_nextPage.nextPage !== "") {
            keyword = result_nextPage.keywords[0];
            regionCode = result_nextPage.regionCode;
            console.log("not null");

        } else if(result_nextPage.index < 0) {
            keyword = query[0];
            regionCode = listRegionCode[0];
            console.log("empty");
        }

        if(!keyword || !regionCode) return "FULLED CRAWL ALL KEYWORD";

        indexDocument = result_nextPage.index + 1;
        nextPageToken = result_nextPage.nextPage;

        console.log("FILTER QUERY INDEX: ", indexDocument, " KEYWORD: ", keyword, " NEXTPAGE: ", nextPageToken, "REGION CODE: ", regionCode);

    } else return "FAILED CRAWL VIDEO ID";

    while(true) {
        
        let response_query = await queryVideoId(base_search_url, part, keyword, relevanceLanguage, regionCode, maxResults, type, nextPageToken, SELECTED_API_KEY);
        
        if(response_query === "QUERY QUOTA EXCEED") return "QUERY QUOTA EXCEED";
        else if(response_query !== "FAILED QUERY VIDEO ID") {
            
            totalResults = response_query.data.pageInfo.totalResults;
            nextPageToken = response_query.data?.nextPageToken;

            if(response_query.data.items.length > 0) {
                let arr = response_query.data.items.map(item => item.id.videoId);

                let result_update_list_id = await handleUpdateListData(arr, [keyword], totalResults, nextPageToken, indexDocument, regionCode);
                
                if(result_update_list_id !== "FAILED UPDATE LIST DATA") {
                    if(result_update_list_id !== null) {
                        await new Promise((resolve, _) => setTimeout(resolve, 500));
                        let result_init = await initializeCommentList(result_update_list_id?._id.toString(), result_update_list_id?.videoIds);
                    }

                    if(!nextPageToken) return "FULLED CRAWL VIDEO ID";
                    else {
                        indexDocument += 1;
                        await new Promise((resolve, _) => setTimeout(resolve, 1500));
                    }
                } 
                else return "FAILED CRAWL VIDEO ID";
            }

        } 
        else return "FAILED CRAWL VIDEO ID";
        
    }
} 

module.exports = { handleCrawlCommentById, handleUpdateBatchState, handleNewCrawl, handleCrawlVideoID, initializeCommentList };
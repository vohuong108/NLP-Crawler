/**
 * crawl top comment of video.
 * @returns The top comment of video
 */
 const { queryCommentThreads } = require('../helper');
 const LIST_API = require("../api");
 const ListTopComment = require("../models/ListTopComment");
 const ListId = require("../models/ListId");
 const mongoose = require('mongoose');

 const base_cmt_url = "https://youtube.googleapis.com/youtube/v3/commentThreads";


 const handleCrawlCommentById = async (
        threadIndex, batchId, batchIndex, batchSize, videoId, videoIndex, nextPage, API_KEY
    ) => {

    let part = ['snippet'];
    let maxResults = 100;
    let order = 'time';
    let textFormat = 'plainText';
    let nextPageToken = nextPage;
    let curThreadIndex = threadIndex;
     

    while(true) {
        
        let responeQuery = await queryCommentThreads(
            base_cmt_url, part, maxResults, order, 
            textFormat, videoId, API_KEY, nextPageToken
        );
        if(responeQuery === "FAILED QUERY") return { message: "FAILED QUERY" };
        if(responeQuery === "QUERY QUOTA EXCEED") return {message: "QUERY QUOTA EXCEED"};
        if(responeQuery === "COMMENT DISABLED" || responeQuery === "VIDEO NOT FOUND") {
            let responeSaveData = await saveCommentThreadData([{
                index: curThreadIndex,
                statusCode: 1,
                parentId: batchId,
                parentIndex: batchIndex,
                parentSize: batchSize,
                videoId: videoId,
                videoIndex: videoIndex,
                commentId: "null" + curThreadIndex,
                topLevelComment: null,
                canReply: null,
                totalReplyCount: null,
                isPublic: null,
                nextPage: null,
                serial: null,
                size: null,
            }]);

            if (responeSaveData === "FAILED SAVE LIST COMMENT THREADS") {
                return { message: "FAILED SAVE CODE 1 COMMENT THREADS" }
            }
            return {message: "RESOURCE NOT FOUND", currentThreadIndex: curThreadIndex};
        }
        
        
        console.log(">>>>>Fetched Top Comments: ", responeQuery.pageInfo.totalResults);

        if(responeQuery?.items?.length > 0) {
            
            let listCommentThreads = responeQuery.items.map((item, index) => ({
                index: curThreadIndex + index,
                statusCode: 3,
                parentId: batchId,
                parentIndex: batchIndex,
                parentSize: batchSize,
                videoId: videoId,
                videoIndex: videoIndex,
                commentId: item.id,
                topLevelComment: item.snippet.topLevelComment,
                canReply: item.snippet.canReply,
                totalReplyCount: item.snippet.totalReplyCount,
                isPublic: item.snippet.isPublic,
                nextPage: responeQuery.nextPageToken,
                serial: index + 1,
                size: responeQuery.pageInfo.totalResults,
            }));

            let responeSaveData = await saveCommentThreadData(listCommentThreads);

            if (responeSaveData === "FAILED SAVE LIST COMMENT THREADS") {
                return {message: "FAILED SAVE LIST COMMENT THREADS"}
            }

            curThreadIndex += (responeQuery.items.length - 1);
            nextPageToken = responeQuery.nextPageToken;

            if (!nextPageToken) return {message: "FULLED CRAWL FOR THIS VIDEO", currentThreadIndex: curThreadIndex};
            await new Promise((resolve, _) => setTimeout(resolve, 1500));
        }
        else {
            let responeSaveData = await saveCommentThreadData([{
                index: curThreadIndex,
                statusCode: 2,
                parentId: batchId,
                parentIndex: batchIndex,
                parentSize: batchSize,
                videoId: videoId,
                videoIndex: videoIndex,
                commentId: "null" + curThreadIndex,
                topLevelComment: null,
                canReply: null,
                totalReplyCount: null,
                isPublic: null,
                nextPage: null,
                serial: null,
                size: null,
            }]);

            if (responeSaveData === "FAILED SAVE LIST COMMENT THREADS") {
                return {message: "FAILED SAVE CODE 2 COMMENT THREADS" };
            }

            return {message: "FULLED CRAWL FOR THIS VIDEO", currentThreadIndex: curThreadIndex};
        }
      
    }
}


const handleCrawlCommentThreads = async (index_api) => {
    if(index_api >= LIST_API.length) {
        return "EXCEED LIST API";
    }

    let batchIndex = null;
    let API_KEY = LIST_API[index_api];
    let currentThreadIndex = null;

    while (true) {
        let nextBatch = await FindNextBatch(batchIndex);
        console.log("RESULT FIND NEXT BATCH: ", {...nextBatch, videoIds: nextBatch.videoIds.length});

        if(nextBatch === "FULLED BATCH VIDEO") return "CRAWL COMMENT THREADS SUCCESSFULLY";
        if(nextBatch === "FAILED FIND NEXT BATCH") return "FAILED FIND NEXT BATCH";

        batchIndex = nextBatch.batchIndex;
        currentThreadIndex = nextBatch.commentThreadIndex;

        for(let i=0; i < nextBatch.videoIds.length; i+=1) {

            let videoId = nextBatch.videoIds[i];

            console.log("===>>>>>>START CRAWL IN VIDEO INDEX: ", nextBatch.videoIndex + i, " ID: ", videoId, " NEXT PAGE: ", nextBatch.nextPage);
            let responeNewCrawl = await handleCrawlCommentById(
                currentThreadIndex + 1, 
                nextBatch.batchId, 
                nextBatch.batchIndex, 
                nextBatch.batchSize, 
                videoId,
                nextBatch.videoIndex + i, 
                nextBatch.nextPage,
                API_KEY
            );
            console.log("===>>>>>>>>END CRAWL WITH: ", responeNewCrawl, "\n");

            if(responeNewCrawl.message === "FULLED CRAWL FOR THIS VIDEO" || responeNewCrawl.message === "RESOURCE NOT FOUND") {
                currentThreadIndex = responeNewCrawl.currentThreadIndex;
                await new Promise((resolve, _) => setTimeout(resolve, 1000));
            } else return responeNewCrawl.message;
        }
    }

    

    

}

const FindNextBatch = async (batchIndexInput) => {
    console.log("INPUT FIND NEXT BATCH VIDEO: ", batchIndexInput);

    for(let i = 0; i < 3; i += 1) {
        try {
            let batchFilter = {}
            let batchProjection = []
            let batchOption = {}

            let currentIndex;
            let nextPage = null;
            let commentThreadIndex = -1;

            let filter = {};
            let projection = ["_id", "index", "parentId", "parentIndex", "parentSize", "videoId", "videoIndex", "nextPage", "serial", "size"];
            let option = { sort: { index: -1 }};

            let lastCommentThread = await ListTopComment.findOne(filter, projection, option);

            if(!batchIndexInput) {
                if(lastCommentThread?._id) {
                    commentThreadIndex = lastCommentThread.index;
                    
                    if(lastCommentThread.nextPage || (lastCommentThread.serial != lastCommentThread.size)) {
                        console.log(`SERIAL/SIZE = ${lastCommentThread.serial}/${lastCommentThread.size}`);

                        currentIndex = lastCommentThread.videoIndex;
                        batchFilter = {_id: mongoose.Types.ObjectId(lastCommentThread.parentId)}
                        batchProjection = ["_id", "videoIds", "size", "index"]
                        batchOption = {}
                        nextPage = lastCommentThread.nextPage;
                        
                    } else if(lastCommentThread.videoIndex === (lastCommentThread.parentSize - 1)){
                        currentIndex = 0;
                        batchFilter = { index: { $gt: lastCommentThread.parentIndex }}
                        batchProjection = ["_id", "videoIds", "size", "index"]
                        batchOption = { sort: { index: 1 }}

                    } else if(lastCommentThread.videoIndex < (lastCommentThread.parentSize - 1)) {
                        currentIndex = lastCommentThread.videoIndex + 1;
                        batchFilter = {_id: mongoose.Types.ObjectId(lastCommentThread.parentId)}
                        batchProjection = ["_id", "videoIds", "size", "index"]
                        batchOption = {}

                    }

                } else {
                    currentIndex = 0;
                    batchFilter = {}
                    batchProjection = ["_id", "videoIds", "size", "index"]
                    batchOption = { sort: { index: 1 }}
                }
            } else {
                commentThreadIndex = lastCommentThread?.index || -1;
                currentIndex = 0;
                batchFilter = { index: { $gt: batchIndexInput }}
                batchProjection = ["_id", "videoIds", "size", "index"]
                batchOption = { sort: { index: 1 }}
            }

            console.log("FILTER NEXT BATCH: ", batchFilter, " VIDEO INDEX: ", currentIndex, " NEXT PAGE: ", nextPage, " THREAD INDEX: ", commentThreadIndex);

            let result = await ListId.findOne(batchFilter, batchProjection, batchOption);

            if(result?._id) {
                return {
                    commentThreadIndex: commentThreadIndex,
                    batchId: result._id,
                    batchIndex: result.index,
                    batchSize: result.size,
                    videoIndex: currentIndex,
                    videoIds: result.videoIds.slice(currentIndex),
                    nextPage: nextPage
                }

            } else {
                return "FULLED BATCH VIDEO";
            }
        } catch (err) {
            console.error("^^^^^^^^^^^[DATABASE]^^^^^^^^^^^ ERROR IN FIND NEXT BATCH: ", err);
            console.log("===>> Replay ", i, "times");
            
            if(i === 2) return "FAILED FIND NEXT BATCH";
        }
        await new Promise((resolve, _) => setTimeout(resolve, 1000));
    }
}

const saveCommentThreadData = async (data) => {
    for(let i = 0; i < 3; i+=1) {
        try {
            let res = await ListTopComment.insertMany(data, {ordered: true});
            console.log("ADDED TO LIST COMMENT THREADS INPUT SIZE: ", data.length, " SIZE: ", res?.length, "\n");

            return "SAVED LIST COMMENT THREADS";

        } catch (err) {
            console.error("[DATABASE] ERROR IN SAVE COMMENT THREADS INPUT SIZE: ", data.length);
            console.log("ERROR: ", err?.code);
            console.log("ERROR DETAILS: ", err?.writeErrors.map(i => i?.err?.errmsg))

            if(err?.code === 11000) {
                console.log(`[DUPLICATE] RESULT ADD SUCCESSFUL = ${data.length} - ${err?.writeErrors.length} = ${data.length - err?.writeErrors.length}\n`);
                return "SAVED LIST COMMENT THREADS WITH DUPLICATE";
            }
            
            console.log("===>>>REPLAY ", i, "times");
            if(i === 2) return "FAILED SAVE LIST COMMENT THREADS";
        }

        await new Promise((resolve, _) => setTimeout(resolve, 1000));
    }
}

module.exports = { handleCrawlCommentThreads };
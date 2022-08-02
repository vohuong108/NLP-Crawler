/**
 * crawl top comment of video.
 * @returns The top comment of video
 */
const { queryCommentThreads } = require('../helper');
const LIST_API = require("../api");
const TopComment = require('../models/TopComment');
const DetailVideo = require('../models/DetailVideo');


const base_cmt_url = "https://youtube.googleapis.com/youtube/v3/commentThreads";

const handleCrawlCommentThreads = async (index_api) => {
    if(index_api >= LIST_API.length) {
        return "EXCEED LIST API";
    }

    let videoIndex = null;
    let API_KEY = LIST_API[index_api];
    let currentThreadIndex = null;

    while (true) {
        let nextBatch = await FindNextVideoFromDetail(videoIndex);
        console.log("RESULT FIND NEXT BATCH: ", nextBatch);

        if(nextBatch === "FULLED FIND NEXT VIDEO") return "CRAWL COMMENT THREADS SUCCESSFULLY";
        if(nextBatch === "FAILED FIND NEXT VIDEO") return "FAILED FIND NEXT VIDEO";

        videoIndex = nextBatch.videoIndex;
        currentThreadIndex = nextBatch.currentThreadIndex;

        console.log("\n===>>>>>> START CRAWL IN VIDEO INDEX: ", videoIndex, " ID: ", nextBatch.videoId, " NEXT PAGE: ", nextBatch.nextPage);
        let responeNewCrawl = await handleCrawlCommentById(
            currentThreadIndex + 1,
            nextBatch.videoId,
            videoIndex, 
            nextBatch.nextPage,
            API_KEY
        );
        console.log("===>>>>>>>> END CRAWL WITH: ", responeNewCrawl, "\n");

        if(responeNewCrawl.message === "FULLED CRAWL FOR THIS VIDEO" || responeNewCrawl.message === "RESOURCE NOT FOUND") {
            await new Promise((resolve, _) => setTimeout(resolve, 1000));
        } else return responeNewCrawl.message;
        
    }

}

const handleCrawlCommentById = async (
    nextThreadIndex, videoId, videoIndex, nextPage, API_KEY
) => {

    let part = ['snippet'];
    let maxResults = 100;
    let order = 'time';
    let textFormat = 'plainText';
    let nextPageToken = nextPage;
    let curThreadIndex = nextThreadIndex;

    while(true) {
        
        let responeQuery = await queryCommentThreads(
            base_cmt_url, part, maxResults, order, 
            textFormat, videoId, API_KEY, nextPageToken
        );
        let currentQuery = {videoId: videoId, videoIndex: videoIndex, nextPage: nextPageToken};

        if(responeQuery === "FAILED QUERY") return { message: "FAILED QUERY" };
        if(responeQuery === "QUERY QUOTA EXCEED") return {message: "QUERY QUOTA EXCEED"};
        if(responeQuery === "COMMENT DISABLED" || responeQuery === "VIDEO NOT FOUND") {
            let responeSaveData = await saveCommentThreadData([{
                index: curThreadIndex,
                statusCode: 1,
                videoId: videoId,
                videoIndex: videoIndex,
                commentId: `${videoId}-null-${curThreadIndex}`,
                topLevelComment: null,
                canReply: null,
                totalReplyCount: null,
                isPublic: null,
                query: currentQuery,
                nextPage: null,
                serial: null,
                size: null
            }]);

            if (responeSaveData === "FAILED SAVE LIST COMMENT THREADS") {
                return { message: "FAILED SAVE CODE 1 COMMENT THREADS" }
            }
            return {message: "RESOURCE NOT FOUND"};
        }
        
        
        console.log(">>>>> FETCHED Top Comments: ", responeQuery.pageInfo.totalResults);

        if(responeQuery?.items?.length > 0) {
            
            let listCommentThreads = responeQuery.items.map((item, index) => ({
                index: curThreadIndex + index,
                statusCode: 3,
                videoId: videoId,
                videoIndex: videoIndex,
                commentId: item.id,
                topLevelComment: item.snippet.topLevelComment,
                canReply: item.snippet.canReply,
                totalReplyCount: item.snippet.totalReplyCount,
                isPublic: item.snippet.isPublic,
                query: currentQuery,
                nextPage: responeQuery.nextPageToken,
                serial: index + 1,
                size: responeQuery.pageInfo.totalResults,
            }));

            let responeSaveData = await saveCommentThreadData(listCommentThreads);

            if (responeSaveData === "FAILED SAVE LIST COMMENT THREADS") {
                return {message: "FAILED SAVE LIST COMMENT THREADS"}
            }

            nextPageToken = responeQuery.nextPageToken;
            curThreadIndex += responeQuery.items.length;

            if (!nextPageToken) return {message: "FULLED CRAWL FOR THIS VIDEO"};

            await new Promise((resolve, _) => setTimeout(resolve, 1500));
        
        } else {
            let responeSaveData = await saveCommentThreadData([{
                index: curThreadIndex,
                statusCode: 2,
                videoId: videoId,
                videoIndex: videoIndex,
                commentId: `${videoId}-null-${curThreadIndex}`,
                topLevelComment: null,
                canReply: null,
                totalReplyCount: null,
                isPublic: null,
                query: currentQuery,
                nextPage: null,
                serial: null,
                size: null
            }]);

            if (responeSaveData === "FAILED SAVE LIST COMMENT THREADS") {
                return {message: "FAILED SAVE CODE 2 COMMENT THREADS" };
            }

            return {message: "FULLED CRAWL FOR THIS VIDEO"};
        }
    
    }
}

const FindNextVideoFromDetail = async (indexInput) => {
    console.log("INPUT FIND NEXT VIDEO: ", indexInput);

    for(let i = 0; i < 3; i += 1) {
        try {
            let Filter = {}
            let currentThreadIndex = -1;

            let lastCommentThread = await TopComment.findOne(
                {}, 
                ["_id", "index", "videoId", "videoIndex", "query", "nextPage", "serial", "size"],
                { sort: { index: -1 }}
            );

            if(lastCommentThread?._id) currentThreadIndex = lastCommentThread.index;

            
            if(indexInput === null || indexInput === undefined) {
                if(lastCommentThread?._id) {
                    
                    if(lastCommentThread.serial !== lastCommentThread.size) {
                        console.log(
                            "QUERY: ", lastCommentThread.query, 
                            `SERIAL/SIZE = ${lastCommentThread.serial}/${lastCommentThread.size}`
                        );

                        // crawl more missing data using its query
                        return {
                            videoId: lastCommentThread.query.videoId,
                            videoIndex: lastCommentThread.query.videoIndex,
                            currentThreadIndex: lastCommentThread.index,
                            nextPage: lastCommentThread.query.nextPage,
                        };
                        

                    } else if (lastCommentThread.nextPage) {
                        console.log("MATCH IN NEXT PAGE NOT NULL");
                        return {
                            videoId: lastCommentThread.videoId,
                            videoIndex: lastCommentThread.videoIndex,
                            currentThreadIndex: lastCommentThread.index,
                            nextPage: lastCommentThread.nextPage
                        };

                    } else {
                        // nextPage is empty that mean video is crawled fully comment.
                        Filter = {index: {$gt: lastCommentThread.videoIndex}};
                    }

                } else {
                    // this point mean just started crawling data 
                    Filter = {};
                }

            } else {
                Filter = {index: {$gt: indexInput}};
            }
            
            console.log("FILTER FIND NEXT VIDEO: ", Filter);

            let result = await DetailVideo.findOne(
                Filter, 
                ["_id", "videoId", "index"], 
                {sort: {index: 1}}
            );
            

            if(result?._id) {
                return {
                    videoId: result.videoId,
                    videoIndex: result.index,
                    currentThreadIndex: currentThreadIndex,
                    nextPage: null
                }

            } else return "FULLED FIND NEXT VIDEO";
            
        } catch (err) {
            console.error("^^^^^^^^^^^[DATABASE]^^^^^^^^^^^ ERROR IN FIND NEXT BATCH: ", err);
            console.log("===>> Replay ", i, "times");
            
            if(i === 2) return "FAILED FIND NEXT VIDEO";
        }
        await new Promise((resolve, _) => setTimeout(resolve, 1000));
    }
}

const saveCommentThreadData = async (data) => {
    for(let i = 0; i < 3; i+=1) {
        try {
            let res = await TopComment.insertMany(data, {ordered: false});
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
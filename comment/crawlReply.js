/**
 * crawl top comment of video.
 * @returns The top comment of video
 */
const { queryReply } = require('../helper');
const LIST_API = require("../api");
const TopComment = require('../models/TopComment');
const ListReply = require('../models/ListReply');


const base_reply_url = "https://youtube.googleapis.com/youtube/v3/comments";

const handleCrawlRely = async (index_api) => {
    if(index_api >= LIST_API.length) {
        return "EXCEED LIST API";
    }

    let commentIndex = null;
    let API_KEY = LIST_API[index_api];
    let currentReplyIndex = null;

    while (true) {
        let nextBatch = await FindNextComment(commentIndex);
        console.log("RESULT FIND NEXT BATCH: ", nextBatch);

        if(nextBatch === "FULLED FIND NEXT COMMENT") return "CRAWL REPLY SUCCESSFULLY";
        if(nextBatch === "FAILED FIND NEXT COMMENT") return "FAILED FIND NEXT COMMENT";

        commentIndex = nextBatch.commentIndex;
        currentReplyIndex = nextBatch.currentReplyIndex;

        console.log("\n===>>>>>> START CRAWL IN COMMENT INDEX: ", commentIndex, " ID: ", nextBatch.commentId, " NEXT PAGE: ", nextBatch.nextPage);
        let responeNewCrawl = await handleCrawlRelyByCommentId(
            currentReplyIndex + 1,
            nextBatch.commentId,
            commentIndex, 
            nextBatch.nextPage,
            API_KEY
        );
        console.log("===>>>>>>>> END CRAWL WITH: ", responeNewCrawl, "\n");

        if(responeNewCrawl.message === "FULLED CRAWL FOR THIS COMMENT" || responeNewCrawl.message === "COMMENT NOT FOUND") {
            await new Promise((resolve, _) => setTimeout(resolve, 1000));
        } else return responeNewCrawl.message;
        
    }

}

const handleCrawlRelyByCommentId = async (
    nextReplyIndex, commentId, commentIndex, nextPage, API_KEY
) => {

    let part = ['snippet'];
    let maxResults = 100;
    let textFormat = 'plainText';
    let nextPageToken = nextPage;
    let curReplyIndex = nextReplyIndex;

    while(true) {
        
        let responeQuery = await queryReply(
            base_reply_url, part, maxResults, 
            textFormat, commentId, API_KEY, nextPageToken
        );
        let currentQuery = {commentId: commentId, commentIndex: commentIndex, nextPage: nextPageToken};

        if(responeQuery === "FAILED QUERY") return { message: "FAILED QUERY" };
        if(responeQuery === "QUERY QUOTA EXCEED") return {message: "QUERY QUOTA EXCEED"};
        if(responeQuery === "COMMENT NOT FOUND") {
            let responeSaveData = await saveReplyData([{
                index: curReplyIndex,
                statusCode: 1,
                commentId: commentId,
                commentIndex: commentIndex,
                replyId: `${commentId}-null-${curReplyIndex}`,
                snippet: null,
                query: currentQuery,
                nextPage: null,
                serial: null,
                size: null
            }]);

            if (responeSaveData === "FAILED SAVE LIST REPLY") {
                return { message: "FAILED SAVE CODE 1 REPLY" }
            }
            return {message: "COMMENT NOT FOUND"};
        }
        
        
        console.log(">>>>> FETCHED REPLYS: ", responeQuery.pageInfo.totalResults || responeQuery?.items?.length);

        if(responeQuery?.items?.length > 0) {
            
            let listReply = responeQuery.items.map((item, index) => ({
                index: curReplyIndex + index,
                statusCode: 3,
                commentId: commentId,
                commentIndex: commentIndex,
                replyId: item.id,
                snippet: item.snippet,
                query: currentQuery,
                nextPage: responeQuery.nextPageToken,
                serial: index + 1,
                size: responeQuery.items.length,
            }));

            let responeSaveData = await saveReplyData(listReply);

            if (responeSaveData === "FAILED SAVE LIST REPLY") {
                return {message: "FAILED SAVE CODE 3 LIST REPLY"}
            }

            nextPageToken = responeQuery.nextPageToken;
            curReplyIndex += responeQuery.items.length;

            if (!nextPageToken) return {message: "FULLED CRAWL FOR THIS COMMENT"};

            await new Promise((resolve, _) => setTimeout(resolve, 1500));
        
        } else {
            let responeSaveData = await saveReplyData([{
                index: curReplyIndex,
                statusCode: 2,
                commentId: commentId,
                commentIndex: commentIndex,
                replyId: `${commentId}-null-${curReplyIndex}`,
                snippet: null,
                query: currentQuery,
                nextPage: null,
                serial: null,
                size: null
            }]);

            if (responeSaveData === "FAILED SAVE LIST REPLY") {
                return {message: "FAILED SAVE CODE 2 REPLY" };
            }

            return {message: "FULLED CRAWL FOR THIS COMMENT"};
        }
    
    }
}
 
const FindNextComment = async (indexInput) => {
    console.log("INPUT FIND NEXT COMMENT: ", indexInput);

    for(let i = 0; i < 3; i += 1) {
        try {
            let Filter = {}
            let currentReplyIndex = -1;

            let lastReply = await ListReply.findOne(
                {}, 
                ["_id", "index", "commentId", "commentIndex", "query", "nextPage", "serial", "size"],
                { sort: { index: -1 }}
            );

            if(lastReply?._id) currentReplyIndex = lastReply.index;

            
            if(indexInput === null || indexInput === undefined) {
                if(lastReply?._id) {
                    
                    if(lastReply.serial !== lastReply.size) {
                        console.log(
                            "QUERY: ", lastReply.query, 
                            `SERIAL/SIZE = ${lastReply.serial}/${lastReply.size}`
                        );

                        // crawl more missing data using its query
                        return {
                            commentId: lastReply.query.commentId,
                            commentIndex: lastReply.query.commentIndex,
                            currentReplyIndex: lastReply.index,
                            nextPage: lastReply.query.nextPage,
                        };
                        

                    } else if (lastReply.nextPage) {
                        console.log("MATCH IN NEXT PAGE NOT NULL");
                        return {
                            commentId: lastReply.commentId,
                            commentIndex: lastReply.commentIndex,
                            currentReplyIndex: lastReply.index,
                            nextPage: lastReply.nextPage
                        };

                    } else {
                        // nextPage is empty that mean video is crawled fully comment.
                        Filter = {index: {$gt: lastReply.commentIndex}, totalReplyCount: {$gt: 0}};
                    }

                } else {
                    // this point mean just started crawling data 
                    Filter = {totalReplyCount: {$gt: 0}};
                }

            } else {
                Filter = {index: {$gt: indexInput}, totalReplyCount: {$gt: 0}};
            }
            
            console.log("FILTER FIND NEXT COMMENT: ", Filter);

            let result = await TopComment.findOne(
                Filter, 
                ["_id", "commentId", "index"],
                {sort: {index: 1}}
            );
            

            if(result?._id) {
                return {
                    commentId: result.commentId,
                    commentIndex: result.index,
                    currentReplyIndex: currentReplyIndex,
                    nextPage: null
                }

            } else return "FULLED FIND NEXT COMMENT";
            
        } catch (err) {
            console.error("^^^^^^^^^^^[DATABASE]^^^^^^^^^^^ ERROR IN FIND NEXT COMMENT: ", err);
            console.log("===>> Replay ", i, "times");
            
            if(i === 2) return "FAILED FIND NEXT COMMENT";
        }
        await new Promise((resolve, _) => setTimeout(resolve, 1000));
    }
}
 
const saveReplyData = async (data) => {
    for(let i = 0; i < 3; i+=1) {
        try {
            let res = await ListReply.insertMany(data, {ordered: false});
            console.log("ADDED TO LIST REPLY INPUT SIZE: ", data.length, " SIZE: ", res?.length, "\n");

            return "SAVED LIST REPLY";

        } catch (err) {
            console.error("[DATABASE] ERROR IN SAVE REPLY INPUT SIZE: ", data.length);
            console.log("ERROR: ", err?.code);
            console.log("ERROR DETAILS: ", err?.writeErrors.map(i => i?.err?.errmsg))

            if(err?.code === 11000) {
                console.log(`[DUPLICATE] RESULT ADD SUCCESSFUL = ${data.length} - ${err?.writeErrors.length} = ${data.length - err?.writeErrors.length}\n`);
                return "SAVED LIST REPLY WITH DUPLICATE";
            }
            
            console.log("===>>>REPLAY ", i, "times");
            if(i === 2) return "FAILED SAVE LIST REPLY";
        }

        await new Promise((resolve, _) => setTimeout(resolve, 1000));
    }
}
 
 module.exports = { handleCrawlRely };
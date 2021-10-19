const ListTopComment = require('./models/ListTopComment');
const { queryUpdateComment } = require('./helper');
const LIST_API = require("./api");
const base_comment_url = "https://youtube.googleapis.com/youtube/v3/comments";


const getListComment = async () => {
    
    for(let i = 0; i < 3; i += 1) {
        try {
            let result = await ListTopComment.find({ published: {$exists: false}}, ["commentId"]).limit(50);
            console.log("===>GET LIST UPDATE COMMENT SUCCESSFUL: ", result?.length);
            return result;
        } catch (err) {
            console.error("################################ERROR IN GET UPDATE: ", err);
            console.log("===>> Replay ", i, "times");
            
            if(i === 2) return "FAILED GET LIST UPDATE COMMENT";
        }
        await new Promise((resolve, _) => setTimeout(resolve, 1000));
    }
}

const handleUpdateComment = async (updateData) => {
    for(let i = 0; i < updateData.length; i += 1) {
        for(let j= 0; j < 3; j += 1) {
            try {
                let result = await ListTopComment.findOneAndUpdate(
                    {commentId: updateData[i].commentId},
                    {published: updateData[i].published, updated: updateData[i].updated},
                    {upsert: true, useFindAndModify: false}
                )
    
                console.log("UPDATED COMMENT ID: ", updateData[i].commentId);
                break;
            } catch (err) {
                console.error("===================>ERROR IN UPDATE COMMENT ID: ", updateData[i].commentId);
                console.log("=>>>>> Replay ", j, "times");
            }
            await new Promise((resolve, _) => setTimeout(resolve, 1000));
        }
    }
}


const handleCrawlUpdateComment = async (index_api) => {
    let SELECTED_API_KEY = LIST_API[index_api];

    while(true) {
        let result_db = await getListComment();
        if(!result_db) { return "FULLED UPDATE"; }
        else if (result_db !== "FAILED GET LIST UPDATE COMMENT") {
            let listCommentId = result_db.map(item => item.commentId).join(",");
            let responeQuery = await queryUpdateComment(base_comment_url, listCommentId, SELECTED_API_KEY);

            if(responeQuery === "QUERY QUOTA EXCEED") return "QUERY QUOTA EXCEED";
            else if(responeQuery !== "FAILED QUERY") {
                console.log("RESPONSE QUERY: " + responeQuery?.items?.length);
                
                if(responeQuery?.items?.length > 0) {
    
                    let updateData = responeQuery.items.map(item => ({
                        commentId: item?.id,
                        published: item?.snippet?.publishedAt,
                        updated: item?.snippet?.updatedAt
                    }));
    
                    let responeUpdateData = await handleUpdateComment(updateData);

                    await new Promise((resolve, _) => setTimeout(resolve, 1500));
                }
                else return "CRAWL EMPTY";
    
            } else {
                return "FAILED CRAWL";
            }
        }
        
      
    }
}

module.exports = { handleCrawlUpdateComment }


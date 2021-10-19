const ListComment = require("./models/ListComment");
const ListId = require("./models/ListId");
const { handleUpdateBatchState, handleCrawlCommentById } = require("./crawl");

const getBatchRetry = async (index) => {
    console.log("BATCH RETRY INDEX: ", index);
    for(let i = 0; i < 3; i += 1) {
        try {
            let filter = index !== null ? { state: 'RETRY', index: {$gt: index} } : { state: 'RETRY' };
            let projection = ['_id', 'videoIds', 'state', 'index'];
            let option = { sort: {index: 1}};
            console.log("FILTER BATCH RETRY: ", filter);

            let result = await ListId.findOne(filter, projection, option);
            console.log("===>GET BATCH RETRY SUCCESSFUL", result?._id);

            if(result?._id) return { 
                ...result._doc,
                _id: result?._id?.toString(),
            }
            else return result;
        } catch (err) {
            console.error("################################ERROR IN GET RETRY: ", err);
            console.log("=>>>>> Replay ", i, "times");
            
            if(i === 2) return "FAILED GET BATCH RETRY";
        }
        await new Promise((resolve, _) => setTimeout(resolve, 1000));
    }
}

const getListVideoRetry = async (batchId) => {
    
    for (let i = 0; i < 3; i += 1) {
        try {
            let filter = { parentId: batchId, $or: [
                {$and: [{amountFetched: {$gt: 0}}, {nextPage: {$ne: ""}}]},
                {$and: [{amountFetched: 0}, {nextPage: ""}]}
            ]}
            let projection = ['videoId', 'nextPage', 'amountFetched'];
            console.log("FILTER LIST RETRY: ", filter);
            let items = await ListComment.find(filter, projection);
    
            console.log("===>>>GET LIST RETRY SUCCESSFUL", items?.length);
            console.log("LIST RETRY CRAWL: ", items?.map(i => `${i.videoId} - ${i?.amountFetched}`));
            return items;
        } catch (err) {
            console.error("################################ERROR IN GET LIST VIDEO RETRY BY BATCH ID", err); 
            console.log("=>>>>> Replay ", i, "times");

            if(i === 2) return "ERROR GET BY BATCH ID";  
        }
        await new Promise((resolve, _) => setTimeout(resolve, 1000));
    }
}

const retryCrawl = async () => {
    let indexBatch = null;

    while (true) {
        let retry = await getBatchRetry(indexBatch);
        
        if(!retry) { return "FULLED BATCH"; }
        else if (retry !== "FAILED GET BATCH RETRY") {
            indexBatch = retry.index;
            let batchId = retry._id;

            let listVideoRetry = await getListVideoRetry(batchId);

            if(listVideoRetry !== 'ERROR GET BY BATCH ID') {
                if(!listVideoRetry || listVideoRetry.length === 0) {
                    //MEANT: crawled full comment in this batch
                    //TODO: update state batch -> DONE
                    //TODO: handle update state can fail -> re-run 3 times
                    await handleUpdateBatchState(batchId, "DONE");
                } else {
                    let isError = false;
    
                    for(item of listVideoRetry) {
                        console.log("===>>>>>>START RETRY IN: ", item.videoId);
                        let response = await handleCrawlCommentById(batchId, item.videoId, item.nextPage, item.amountFetched);
                        console.log("===>>>>>>>>END RETRY WITH: ", response, "\n");

                        if(response === "CRAWL QUOTA EXCEED") {
                            await handleUpdateBatchState(batchId, "RETRY");
                            return response;
                        }
                        else if(response !== "FULLED CRAWL") {
                            isError = true;
                        }
                        await new Promise((resolve, _) => setTimeout(resolve, 1000));

                    }
    
                    if(!isError) {
                        //MEANT: crawled full comment in this batch 
                        //TODO: update state batch -> DONE
                        //TODO: handle update state can fail -> re-run 3 times
                        await handleUpdateBatchState(batchId, "DONE");
                    }
                }
            } 
        }
        else return "FAILED GET BATCH RETRY";
    }

}

module.exports = retryCrawl;
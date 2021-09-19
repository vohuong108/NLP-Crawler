const ListComment = require("./models/ListComment");
const ListId = require("./models/ListId");
const { handleUpdateBatchState, handleCrawlCommentById } = require("./crawl");

const getBatchRetry = async (index) => {
    for(let i = 0; i < 3; i += 1) {
        try {
            let filter = index ? { state: 'RETRY', index: {$gt: index} } : { state: 'RETRY' };
            let projection = ['_id', 'videoIds', 'state', 'index'];
            let option = { sort: {index: 1}};

            let result = await ListId.findOne(filter, projection, option);
            console.log("GET BATCH RETRY SUCCESSFUL", result?._id);
            return result;
        } catch (err) {
            console.error("ERROR IN GET RETRY: ", err);
            console.log("=>>>>> Replay ", i, "times");
            
            if(i === 2) return "FAILED GET BATCH RETRY";
        }
        await new Promise((resolve, _) => setTimeout(resolve, 1000));
    }
}

const getListVideoRetry = async (batchId) => {
    for (let i = 0; i < 3; i += 1) {
        try {
            let filter = { parentId: batchId, $nor: [{nextPage: null}, {amountFetched: {$gt: 0}}] }
            let projection = ['videoId', 'nextPage'];
            let items = await ListComment.find(filter, projection);
    
            console.log("GET LIST RETRY SUCCESSFUL", items?.length);
            console.log("LIST RETRY: ", items?.map(i => i.videoId));
            return items;
        } catch (err) {
            console.error("ERROR IN GET LIST VIDEO RETRY BY BATCH ID", err); 
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
                        console.log("===>>>>>>>>START RETRY IN: ", item.videoId);
                        let response = await handleCrawlCommentById(item.videoId, item.nextPage);
                        console.log("===>>>>>>>>END RETRY WITH: ", response);
                        if(response !== "FULLED CRAWL") {
                            //TODO: handle retry crawl failed -> set isError to true
                            isError = true;
                        }
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
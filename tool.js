const retryCrawl = require("./retry");
const { handleNewCrawl, handleCrawlVideoID, initializeCommentList } = require("./crawl");
const { handleCrawlVideoDetail } = require("./crawlDetailVideo");
const connectDB = require("./db");
const ListId = require("./models/ListId");
const { default: axios } = require("axios");
const ListComment = require("./models/ListComment");
const DetailVideo = require("./models/DetailVideo");
const User = require("./models/User");


const tool = async () => {
    
    let isConnected = await connectDB();

    if(isConnected === "CONNECTED TO DATABASE") {
        // console.log("=====>>>>RUN RETRY CRARWL");
        // let res1 = await retryCrawl();
        // console.log("=====>>>>RES RETRY CRARWL: ", res1);

        // console.log("=====>>>>RUN READY CRARWL");
        // let res2 = await handleNewCrawl();
        // console.log("=====>>>>RES READY CRARWL: ", res2);


        // console.log("=====>>>>RUN CRARWL ID");
        // let res3 = await handleCrawlVideoID();
        // console.log("=====>>>>RES CRARWL ID: ", res3);

        // let res = await ListComment.deleteMany({ parentId: {$in: ["614f18b4e2eeb869f39d6eca", 
        // "614f18b7e2eeb869f39d6eff", 
        // "614f18bae2eeb869f39d6f34",
        // "614f18bee2eeb869f39d6f69",
        // "614f18c1e2eeb869f39d6f9e",
        // "614f18c4e2eeb869f39d6fd3"]}});
        // console.log(res);
        let index_api = 38;

        while(true) {
            console.log("=====>>>>RUN CRARWL ID");
            console.log("INDEX API: ", index_api);
            let res3 = await handleCrawlVideoID(index_api);
            console.log("\n=====>>>>RES CRARWL ID: ", res3);
            
            if(res3 === "QUERY QUOTA EXCEED") {
                index_api += 1;
            }
            else if(res3 === "FULLED CRAWL ALL KEYWORD" || res3 === "FAILED CRAWL VIDEO ID") break;
    
        }
        
        // let arr = [
        //     {parentId: "1", videoId: "GwIo3gDZCVQ1", amountFetched: 20},
        //     {parentId: "2", videoId: "GwIo3gDZCVQ", amountFetched: 30},
        //     {parentId: "614f11e989ba1a3821313684", videoId: "GwIo3gDZCVQ2", amountFetched: 40},
        //     {parentId: "4", videoId: "GwIo3gDZCVQ3", amountFetched: 60}
        // ]
        // try {
        //     let res4 = await User.insertMany(arr, {ordered: false});
        //     console.log("============================");
        //     console.log("RES: ", res4);
        //     console.log("RES-CODE: ", res4?.code);
        //     console.log("============================");
        // } catch (err) {
        //     console.log("#============================");
        //     console.log(err);
        //     console.log("ERR-CODE: ", err?.code);
        //     console.log("ERR-CODE: ", err?.writeErrors.length);
        // }

        
        // console.log("=====>>>>RUN CRAWL VIDEO DETAILS");
        // let res4 = await handleCrawlVideoDetail();
        // console.log("=====>>>>RUN CRAWL VIDEO DETAILS: ", res4);

        // let index_batch = -1;

        // while (true) {
            
        //     console.log("RUN IN BATCH: ", index_batch);
        //     let res_1 = await ListId.findOne({index: {$gt: index_batch}}, ['_id', 'videoIds', 'index'], { sort: {index: 1}});
        //     console.log("RES_1: ", res_1._id, "videoIds: ", res_1.videoIds.length);
        //     let res_2 = await DetailVideo.find({parentId: res_1._id});
        //     console.log("RES_2: ", res_2.length);
        //     if(!res_1) return;

        //     if(res_2.length !== res_1.videoIds.length) {
        //         console.log("=================>ERROR: ", res_1._id, "\n");

        //         for(var i = 0; i < res_2.length; i += 1) {
        //             if(res_2[i].videoId !== res_1.videoIds[i].videoId) {
        //                 console.log("==============>INDEX:", i);
        //             }
        //         }
        //     }

        //     else console.log("EQUALT: ", res_1.index);

        //     index_batch += 1;
        //     await new Promise((resolve, _) => setTimeout(resolve, 1500));
        // }
        
    }

    // let res =  await axios.get("https://youtube.googleapis.com/youtube/v3/commentThreads?part=snippet%2Creplies&maxResults=1000&key=AIzaSyCM2zo3xCPcW23oQAPBPkUe08WzuKFhhzs&videoId=h_w8_lLlCu4")

    // console.log('res: ', res);
}

module.exports = tool;




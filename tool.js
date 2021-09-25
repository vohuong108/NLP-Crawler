const retryCrawl = require("./retry");
const { handleNewCrawl, handleCrawlVideoID, initializeCommentList } = require("./crawl");
const { handleCrawlVideoDetail } = require("./crawlDetailVideo");
const connectDB = require("./db");
const ListId = require("./models/ListId");
const { default: axios } = require("axios");
const ListComment = require("./models/ListComment");
const DetailVideo = require("./models/DetailVideo");



const tool = async () => {
    
    let isConnected = await connectDB();

    if(isConnected === "CONNECTED TO DATABASE") {
        // console.log("=====>>>>RUN RETRY CRARWL");
        // let res1 = await retryCrawl();
        // console.log("=====>>>>RES RETRY CRARWL: ", res1);

        // console.log("=====>>>>RUN READY CRARWL");
        // let res2 = await handleNewCrawl();
        // console.log("=====>>>>RES READY CRARWL: ", res2);

        while(true) {
            console.log("=====>>>>RUN CRARWL ID");
            let res3 = await handleCrawlVideoID();
            console.log("\n=====>>>>RES CRARWL ID: ", res3);
            if(res3 === "FULLED CRAWL ALL KEYWORD" || res3 === "QUERY QUOTA EXCEED") break;
    
        }
        

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




const retryCrawl = require("./retry");
const { handleNewCrawl, handleCrawlVideoID, initializeCommentList } = require("./crawl");
const { handleCrawlVideoDetail, getAllVideoIdInListComment } = require("./crawlDetailVideo");
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


        let index_api = 79;

        // while(true) {
        //     console.log("=====>>>>RUN CRARWL ID");
        //     console.log("INDEX API: ", index_api);
        //     let res3 = await handleCrawlVideoID(index_api);
        //     console.log("\n=====>>>>RES CRARWL ID: ", res3);
            
        //     if(res3 === "QUERY QUOTA EXCEED") {
        //         index_api += 1;
        //     }
        //     else if(res3 === "FULLED CRAWL ALL KEYWORD" || res3 === "FAILED CRAWL VIDEO ID") break;
    
        // }

        
        console.log("=====>>>>RUN CRAWL VIDEO DETAILS");
        console.log("INDEX API: ", index_api);
        let res3 = await handleCrawlVideoDetail(index_api);
        console.log("\n=====>>>>CRAWL VIDEO DETAILS: ", res3);
              
    }
}

module.exports = tool;




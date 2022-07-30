const retryCrawl = require("./retry");
const { handleCrawlVideoID } = require("./crawl");
const { handleCrawlVideoDetail } = require("./crawlDetailVideo");
const { handleCrawlCommentThreads } = require("./comment/crawlComment");

const connectDB = require("./db");
const { default: axios } = require("axios");


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

        while(true) {
            // console.log("=====>>>>RUN CRARWL ID");
            // console.log("INDEX API: ", index_api);
            // let res3 = await handleCrawlVideoID(index_api);
            // console.log("\n=====>>>>RES CRARWL ID: ", res3);
            
            // if(res3 === "QUERY QUOTA EXCEED") {
            //     index_api += 1;
            // }
            // else if(res3 === "FULLED CRAWL ALL KEYWORD" || res3 === "FAILED CRAWL VIDEO ID" || "EXCEED LIST API") break;

            // console.log("=====>>>>RUN CRAWL VIDEO DETAILS");
            // console.log("INDEX API: ", index_api);
            // let res3 = await handleCrawlVideoDetail(index_api);
            // console.log("\n=====>>>>CRAWL VIDEO DETAILS: ", res3);

            // if(res3 === "QUERY QUOTA EXCEED") {
            //     index_api += 1;
            // }
            // else if(res3 === "FULLED DETAIL" || res3 === "FAILED UPDATE VIDEO DETAIL" || "EXCEED LIST API") break;


            console.log("=====>>>>RUN CRAWL COMMENT THREADS");
            console.log("INDEX API: ", index_api);
            let res3 = await handleCrawlCommentThreads(index_api);
            console.log("\n=====>>>>RES CRAWL COMMENT THREADS: ", res3);
            
            if(res3 === "QUERY QUOTA EXCEED") {
                index_api += 1;
            }
            else break;
    
        }
        
    }
}

module.exports = tool;




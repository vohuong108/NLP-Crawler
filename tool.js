const { handleCrawlVideoID } = require("./crawl");
const { handleCrawlVideoDetail } = require("./crawlDetailVideo");
const { handleCrawlCommentThreads } = require("./comment/crawlComment");

const connectDB = require("./db");
const { default: axios } = require("axios");


const tool = async () => {
    let isConnected = await connectDB();

    if(isConnected === "CONNECTED TO DATABASE") {
        let index_api = 82;
        let order = null;

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


            // console.log("=====>>>>RUN CRAWL COMMENT THREADS");
            // console.log("INDEX API: ", index_api);
            // let res3 = await handleCrawlCommentThreads(index_api);
            // console.log("\n=====>>>>RES CRAWL COMMENT THREADS: ", res3);
            
            // if(res3 === "QUERY QUOTA EXCEED") {
            //     index_api += 1;

            // } else break;
            
            let res = await createSequantialVideoDetail(order);
            console.log("RES: ", res);
            if((res.message === "FULL CREATE ORDER") || (res.message === "FAILED CREATE ORDER")) break;
            else {
                order = res.currentOrder + 1;
                await new Promise((resolve, _) => setTimeout(resolve, 300));
            }
    
        }
        
    }
}

const DetailVideo = require("./models/DetailVideo");

const createSequantialVideoDetail = async (nextOrder) => {
    for(let i=0; i<3; i++) {
        try {
            console.log("INPUT: ", nextOrder);
            if(nextOrder !== null && nextOrder !== undefined) {
                let result = await DetailVideo.findOneAndUpdate({index: {$exists: false}}, {$set: {index: nextOrder}}, {sort: {_id: 1}, returnDocument: "after"});
                console.log("CREATE ORDER DONE: ", result?._id, " WITH INDEX: ", result?.index);

                if(result?._id) return {message: "CREATE ORDER DONE", currentOrder: result.index};
                else return {message: "FULL CREATE ORDER"};
            } else {
                let result = await DetailVideo.findOne({index: {$not: {$eq: null}}}, ["_id", "index"], {sort: {_id: -1}});
                console.log("FIND DOCUMENT DONE: ", result?._id, " WITH INDEX: ", result?.index);

                if(result?._id) return {message: "FIND DOCUMENT HAS INDEX FIELD DONE", currentOrder: result.index};
                else return {message: "ALL DOCUMENT HASN'T INDEX FIELD", currentOrder: -1};
            }
        } catch (err) {
            console.error("^^^^^^^^^^^[DATABASE]^^^^^^^^^^^ ERROR IN CREATE ORDER: ", err);
            console.log("===>> Replay ", i, "times");
            
            if(i === 2) return {message: "FAILED CREATE ORDER"};
        }
        await new Promise((resolve, _) => setTimeout(resolve, 1000));
    }
}

module.exports = tool;




const retryCrawl = require("./retry");
const { handleNewCrawl, handleCrawlVideoID, initializeCommentList } = require("./crawl");
const connectDB = require("./db");
const ListId = require("./models/ListId");
const { default: axios } = require("axios");



const tool = async () => {
    
    let isConnected = await connectDB();

    if(isConnected === "CONNECTED TO DATABASE") {
        console.log("=====>>>>RUN RETRY CRARWL");
        let res1 = await retryCrawl();
        console.log("=====>>>>RES RETRY CRARWL: ", res1);

        console.log("=====>>>>RUN READY CRARWL");
        let res2 = await handleNewCrawl();
        console.log("=====>>>>RES READY CRARWL: ", res2);

        // console.log("=====>>>>RUN CRARWL ID");
        // let res3 = await handleCrawlVideoID();
        // console.log("=====>>>>RES CRARWL ID: ", res3);
        
    }

    // let res =  await axios.get("https://youtube.googleapis.com/youtube/v3/commentThreads?part=snippet%2Creplies&maxResults=1000&key=AIzaSyCM2zo3xCPcW23oQAPBPkUe08WzuKFhhzs&videoId=h_w8_lLlCu4")

    // console.log('res: ', res);
}

module.exports = tool;




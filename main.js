const crawler = require('./helper');
const query = require('./query');
const connectDB = require('./db');
const VideoID = require('./models/VideoID');
const Comment = require('./models/Comment');
const mongoose = require('mongoose');

const main = async () => {
  
  let base_search_url = "https://youtube.googleapis.com/youtube/v3/search";
  let base_cmt_url = "https://youtube.googleapis.com/youtube/v3/commentThreads";
  // let API_KEY = "AIzaSyCM2zo3xCPcW23oQAPBPkUe08WzuKFhhzs";
  let API_KEY = "AIzaSyBEoXFRdY-pNXuhCwf-83KRH4RO8depHLU";
  let nextPageToken = "";
  let pageTokenCrawCmt = "";
  let totalResultsID = 0;
  let fetched = 0;
  

  let handleCrawlComment = async (videoId) => {
    let part = ['snippet', 'replies'];
    let maxResults = 100;
    let order = 'time';
    let textFormat = 'plainText';
    let nextPageToken = "";
    let amountOfFetchedComments = 0;

    while(true) {
      try {
        let result = await query(base_cmt_url, part, maxResults, order, textFormat, videoId, API_KEY, nextPageToken);
  
        nextPageToken = result.data.nextPageToken;
        amountOfFetchedComments = result.data.items.length + amountOfFetchedComments;
        console.log("Fetched comments: ", amountOfFetchedComments);

        if(result.data.items.length > 0) {

          let listComments = result.data.items.map(item => ({
            topLevelComment: {
              id: item.snippet.topLevelComment.id,
              content: item.snippet.topLevelComment.snippet.textOriginal,
              author: item.snippet.topLevelComment.snippet.authorDisplayName,
              likeCount: item.snippet.topLevelComment.snippet.likeCount,
              totalReplyCount: item.snippet.totalReplyCount,
              isPublic: item.snippet.isPublic,
            },
            replies: item?.replies?.comments.map(reply => ({
              id: reply.id,
              content: reply.snippet.textOriginal,
              author: reply.snippet.authorDisplayName,
              likeCount: reply.snippet.likeCount,
            }))
          }));

          await Comment.findOneAndUpdate(
            {videoId: videoId},
            {$push: {comments: listComments}, numofFetchedComments: amountOfFetchedComments, nextPage: result.data.nextPageToken },
            {upsert: true}

          ).then(() => console.log("saved in: ", amountOfFetchedComments));

          if(!nextPageToken) break;
          await new Promise((resolve, _) => setTimeout(resolve, 1500));

        } else { break; }
      } catch (e) {
        console.error("err in crawl cmt child: ", e);
        return "ERROR";
      }
    }

    return "DONE";
  }
  
  let handleCrawlVideoID = async (nextPageToken) => {
    let part="snippet";
    let query = ["machine%20learning", "robotics", "artificial intelligence"];
    let relevanceLanguage = "en";
    let regionCode = "US" ;
    let type = "video";
    
    try {
      let result = await crawler(base_search_url, part, query[0], relevanceLanguage, regionCode, type, nextPageToken, API_KEY);
      
      let arr = result.data.items.map(item => ({
        videoId: item.id.videoId,
        title: item.snippet.title,
      }));

      totalResultsID = result.data.pageInfo.totalResults;

      await VideoID.create({
        videoIds: arr, 
        keywords: [query[0]],
        totalOfVideo: result.data.pageInfo.totalResults,
        nextPage: result.data.nextPageToken,
      }).then(() => fetched = arr.length);

      if(fetched < totalResultsID) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await handleCrawlVideoID(result.data.nextPageToken);
      }

      
      // return arr.map(item => handleCrawlComment(item.videoId, item.title));
      
    } catch (e) {
      console.error("err in crawl ID: ", e);
    }
  } 

  let crawlData = async () => {
    try {
      let promises = await handleCrawlVideoID();
      let listComment = await Promise.all(promises);

      listComment.map(item => {
        VideoID.insertOne({
          videoId: item.videoId,

        })
      })
      console.log("list: ", listComment);
    } catch (e) {}
  }

  let getVideoIdFromDB = async (isAgain) => {
    let projection = ['_id', 'videoIds', 'retry'];
    let filter = isAgain 
                      ? {$nor: [{state: 'CHECKED'}, {retry: {$exists: true, $type: 'array', $ne:[]}} ]}
                      : {state: 'UNCHECKED'};
    try {
      
      let response = await VideoID.findOne(filter, projection, { sort: { '_id': 1} });

      console.log("ID: ", response)
      if(!response) return response;
      let arr_id = response.videoIds.map(item => item.videoId);
      
      return { arr_id: arr_id, objectId: response._id, retry: response.retry }

    } catch (err) {
      console.error("Error in get ID: ", err);
    }
  }

  let upadateStateID = async (objectId, newState, newRetry ) => {
    try {
      let id = mongoose.Types.ObjectId(objectId);
      let newUpdate = {state: newState, retry: newRetry}
      
      let respone = await VideoID.findOneAndUpdate({_id: id}, {$set: newUpdate}, {timestamps: true, new: true, useFindAndModify: false});
      
      
    } catch (err) {
      console.error("Error in update state: ", err);
    }
  }

  let test = async () => {
    try {
      console.log("run in test")
      let res = await getVideoIdFromDB(true);
      console.log("res: ", res);
    } catch (err) {
      console.error("err in test: ", err);
      return "ERROR";
    }
    
  }

  let isConnected = await connectDB();
  
  
  
  let startup = true;
  while (isConnected) {
    try {
      let respone = startup ? await getVideoIdFromDB(true) : await getVideoIdFromDB(false);

      if (!respone) { return false; }

      console.log("================================QUERY: ", respone.arr_id, "================================");
      let retryClone = respone.retry.map(i => i);

      for(const val of respone.arr_id) {
        console.log("start fetched by id: ", val);
  
        try {
          let stateCrawlCmt = await handleCrawlComment(val);
          
          console.log("end fetched by id: ", val);
          console.log("respone: ", stateCrawlCmt);
  
          if(stateCrawlCmt !== 'DONE') {
            retryClone.push(val);
            await upadateStateID(respone.objectId, "CHECKED", retryClone);
          }
  
        } catch(e) {
          console.error("err in call cmt: ", e);
        }
        
      }

      await upadateStateID(respone.objectId, "CHECKED", retryClone);
      startup = false;

    } catch (error) { 
      console.error("Error in startup main: ", error);
      return false; 
    }
  }
  

}

module.exports = main;

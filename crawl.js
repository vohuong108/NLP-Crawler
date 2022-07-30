/**
 * crawl video id
 * @returns the list of video id
 */

const ListComment = require('./models/ListComment');
const ListId = require('./models/ListId');
const { queryVideoId } = require('./helper');
const LIST_API = require("./api");
const LIST_REGION_CODE = require("./regionCode");
const mongoose = require('mongoose');

const base_search_url = "https://youtube.googleapis.com/youtube/v3/search";


const getNextPageCrawlVideoId = async () => {
    for (let i = 0; i < 3; i += 1) {
        try {
            let result = await ListId.findOne({}, ["nextPage", "index", "keywords", "regionCode"], { sort: {"_id": -1}})
            
            if(result) {
                return { index: result.index, nextPage: result.nextPage, keywords: result.keywords, regionCode: result.regionCode };
            }
            else return {
                index: -1,
                nextPage: "",
                keywords: [],
                regionCode: "",
            };
        } catch (err) {
            console.log("[DATABSE] ERROR IN GET NEXTPAGE CRAWL ID", err);
            console.log("===>>>Replay ", i, "times");

            if(i === 2) return "FAILED GET NEXTPAGE";
        }
        await new Promise((resolve, _) => setTimeout(resolve, 1000));
    }
}

//Save the list videoId found to mongooDB cloud
const saveListVideoId = async (list, keywords, totalOfVideo, nextPage, index, regionCode) => {
    for(let i= 0; i < 3; i += 1) {
        try {
            let resDocument = await ListId.create({
                videoIds: list, 
                keywords: keywords,
                totalOfVideo: totalOfVideo,
                nextPage: nextPage ? nextPage : "",
                state: "READY",
                size: list.length || 0,
                index: index,
                regionCode: regionCode,
            })

            console.log("SAVED ID SUCCESSFUL IN: ", index, " INPUT: ", list.length, " SIZE: ", resDocument?.videoIds?.length);
            if(list.length !== resDocument?.videoIds?.length){
                return "FAILED UPDATE LIST DATA";
            }

            return resDocument;
        } catch (err) {
            console.error("[DATABASE] ERROR IN UPDATE LIST DATA: ", err);
            console.log("=>>>>> Replay ", i, "times");

            if(i === 2) return "FAILED UPDATE LIST DATA";
        }
        await new Promise((resolve, _) => setTimeout(resolve, 1000));
    }
}

//CRAWL list videoId with keywords
const handleCrawlVideoID = async (index_api) => {
    if(index_api >= LIST_API.length) {
        return "EXCEED LIST API";
    }
    
    let part="snippet";
    let query = ["machine learning", "robotics", "artificial intelligence"];
    let keyword = "";  
    let relevanceLanguage = "en";
    let listRegionCode = LIST_REGION_CODE;
    let SELECTED_API_KEY = LIST_API[index_api];
    let regionCode = "";
    let type = "video";
    let maxResults = 50;
    let nextPageToken = "";
    let indexDocument = 0;
    
    let result_nextPage = await getNextPageCrawlVideoId();

    if(result_nextPage !== "FAILED GET NEXTPAGE") {
        console.log("GET NEXTPAGE CRAWL VIDEOID SUCCESSFUL: ", result_nextPage);

        if(result_nextPage.index > 0 && result_nextPage.nextPage === "") {
            let i_key = query.findIndex(item => item === result_nextPage.keywords[0]);
            let i_code = listRegionCode.findIndex(item => item === result_nextPage.regionCode);
            console.log("i_key: ", i_key, "i_code: ", i_code);

            if(i_key === query.length - 1 && i_code === listRegionCode.length - 1) return "FULLED CRAWL ALL KEYWORD";
            else if(i_key === query.length - 1 && i_code < listRegionCode.length - 1) {
                regionCode = listRegionCode[i_code + 1];
                keyword = query[0];
            }
            else if(i_key < query.length - 1) {
                regionCode = result_nextPage.regionCode;
                keyword = query[i_key + 1];
            }
            
        }
        else if(result_nextPage.index > 0 && result_nextPage.nextPage !== "") {
            keyword = result_nextPage.keywords[0];
            regionCode = result_nextPage.regionCode;
            console.log("[GET NEXTPAGE CRAWL VIDEOID] not null");

        } else if(result_nextPage.index < 0) {
            keyword = query[0];
            regionCode = listRegionCode[0];
            console.log("[GET NEXTPAGE CRAWL VIDEOID] empty");
        }

        if(!keyword || !regionCode) return "FULLED CRAWL ALL KEYWORD";

        indexDocument = result_nextPage.index + 1;
        nextPageToken = result_nextPage.nextPage;

        console.log("FILTER QUERY INDEX: ", indexDocument, " KEYWORD: ", keyword, " NEXTPAGE: ", nextPageToken, "REGION CODE: ", regionCode);

    } else return "FAILED CRAWL VIDEO ID";

    while(true) {
        
        let response_query = await queryVideoId(base_search_url, part, keyword, relevanceLanguage, regionCode, maxResults, type, nextPageToken, SELECTED_API_KEY);
        
        if(response_query === "QUERY QUOTA EXCEED") return "QUERY QUOTA EXCEED";
        else if(response_query !== "FAILED QUERY VIDEO ID") {
            
            totalResults = response_query.data.pageInfo.totalResults;
            nextPageToken = response_query.data?.nextPageToken;

            if(response_query.data.items.length > 0) {
                let arr = response_query.data.items.map(item => item.id.videoId);

                let result_update_list_id = await saveListVideoId(arr, [keyword], totalResults, nextPageToken, indexDocument, regionCode);

                if(result_update_list_id !== "FAILED UPDATE LIST DATA") {
                    console.log(`SAVE: ${response_query.data.items[0].snippet.publishedAt} ==> ${response_query.data.items[response_query.data.items.length -1].snippet.publishedAt}`)

                    if(!nextPageToken) return "FULLED CRAWL VIDEO ID";
                    else {
                        indexDocument += 1;
                        await new Promise((resolve, _) => setTimeout(resolve, 1500));
                    }
                } 
                else return "FAILED CRAWL VIDEO ID";
            }

        } 
        else return "FAILED CRAWL VIDEO ID";
        
    }
} 

module.exports = { handleCrawlVideoID };
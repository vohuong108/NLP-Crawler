const ListComment = require('./models/ListComment');
const ListId = require('./models/ListId');
const {queryVideoId} = require('./helper');
const LIST_API = require("./api");
const LIST_REGION_CODE = require("./regionCode");
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
            console.log("#########################ERROR IN GET NEXTPAGE CRAWL ID", err);
            console.log("===>>>Replay ", i, "times");

            if(i === 2) return "FAILED GET NEXTPAGE";
        }
        await new Promise((resolve, _) => setTimeout(resolve, 1000));
    }
}

//Save the list videoId found to mongooDB cloud
const handleUpdateListData = async (list, keywords, totalOfVideo, nextPage, index, regionCode) => {
    for(let i= 0; i < 3; i += 1) {
        try {
            let resDocument = await ListId.create({
                videoIds: list, 
                keywords: keywords,
                totalOfVideo: totalOfVideo,
                nextPage: nextPage ? nextPage : "",
                state: "READY",
                index: index,
                regionCode: regionCode,
            })

            console.log("SAVED ID SUCCESSFUL IN: ", index, " SIZE: ", resDocument?.videoIds?.length);

            return resDocument;
        } catch (err) {
            console.error("===================>ERROR IN UPDATE LIST DATA: ", err);
            console.log("=>>>>> Replay ", i, "times");

            if(i === 2) return "FAILED UPDATE LIST DATA";
        }
        await new Promise((resolve, _) => setTimeout(resolve, 1000));
    }
}

//Initialize a record(document) corresponding to the videIds found
//Each record have {comments: [], nextPage: ""}
const initializeCommentList = async (parentId, listId) => {
    
    let edited_list_id = listId?.map(item => ({
        parentId: parentId,
        videoId: item.videoId,
        comments: [],
        amountFetched: 0,
        nextPage: "",
    }));

    for(let i = 0; i < 3; i += 1) {
        try {
            let res = await ListComment.insertMany(edited_list_id, {ordered: false});
            console.log("ADDED TO INITIAL COMMENT LIST: ", parentId, " SIZE: ", res?.length, "\n");

            return "INITED LIST COMMENT";

        } catch (err) {
            console.error("===================>ERROR IN INITIAL COMMENT: ", parentId, " SIZE: ", listId?.length);
            console.log("ERROR: ", err?.code);

            if(err?.code === 11000) {
                console.log(`ADDED SUCCESSFUL = ${listId?.length} - ${err?.writeErrors.length} = ${listId?.length - err?.writeErrors.length}\n`);
                return "INITED LIST COMMENT WITH DUPLICATE";
            }
            
            console.log("===>>>REPLAY ", i, "times");
            if(i === 2) return "FAILED INITIAL COMMENT LIST";
        }
        await new Promise((resolve, _) => setTimeout(resolve, 1000));
    }
}

//CRAWL list videoId with keywords
const handleCrawlVideoID = async (index_api) => {
    let part="snippet";
    let query = ["machine learning", "robotics", "artificial intelligence"];
    let keyword = "";
    let listRegionCode = LIST_REGION_CODE;
    let SELECTED_API_KEY = LIST_API[index_api];
    let regionCode = "";
    let type = "video";
    let maxResults = 50;
    let nextPageToken = "";
    let indexDocument = 0;
    
    let result_nextPage = await getNextPageCrawlVideoId();

    if(result_nextPage !== "FAILED GET NEXTPAGE") {
        console.log("GET NEXTPAGE SUCCESSFUL: ", result_nextPage);

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
            console.log("not null");

        } else if(result_nextPage.index < 0) {
            keyword = query[0];
            regionCode = listRegionCode[0];
            console.log("empty");
        }

        if(!keyword || !regionCode) return "FULLED CRAWL ALL KEYWORD";

        indexDocument = result_nextPage.index + 1;
        nextPageToken = result_nextPage.nextPage;

        console.log("FILTER QUERY INDEX: ", indexDocument, " KEYWORD: ", keyword, " NEXTPAGE: ", nextPageToken, "REGION CODE: ", regionCode);

    } else return "FAILED CRAWL VIDEO ID";

    while(true) {
        
        let response_query = await queryVideoId(base_search_url, part, keyword, null, regionCode, maxResults, type, nextPageToken, SELECTED_API_KEY);
        
        if(response_query === "QUERY QUOTA EXCEED") return "QUERY QUOTA EXCEED";
        else if(response_query !== "FAILED QUERY VIDEO ID") {
            
            totalResults = response_query.data.pageInfo.totalResults;
            nextPageToken = response_query.data?.nextPageToken;

            if(response_query.data.items.length > 0) {
                let arr = response_query.data.items.map(item => ({ videoId: item.id.videoId, title: item.snippet.title}));

                let result_update_list_id = await handleUpdateListData(arr, [keyword], totalResults, nextPageToken, indexDocument, regionCode);
                
                if(result_update_list_id !== "FAILED UPDATE LIST DATA") {
                    if(result_update_list_id !== null) {
                        await new Promise((resolve, _) => setTimeout(resolve, 500));
                        let result_init = await initializeCommentList(result_update_list_id?._id.toString(), result_update_list_id?.videoIds);
                    }

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

module.exports = {handleCrawlVideoID}
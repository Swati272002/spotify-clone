import {ACCESS_TOKEN, EXPIRES_IN, logout, TOKEN_TYPE} from "./common";

const BASE_API_URL = import.meta.env.VITE_API_BASE_URL;

const getAccessToken = ()=>{
    const accessToken = localStorage.getItem(ACCESS_TOKEN);
    const expiresIn = localStorage.getItem(EXPIRES_IN);
    const tokenType = localStorage.getItem(TOKEN_TYPE);
    if(Date.now() < expiresIn){
        return {accessToken, tokenType}
    }else {
        logout();
    }

}

const createAPIConfig = ({accessToken, tokenType}, method="GET")=>{
    return {
        headers: {
            Authorization: `${tokenType} ${accessToken}`
        },
        method
    }
}


export const fetchRequest = async (endpoint)=>{
    const uri = `${BASE_API_URL}/${endpoint}`;
    const result = await fetch(uri, createAPIConfig(getAccessToken()));
    return result.json();
}
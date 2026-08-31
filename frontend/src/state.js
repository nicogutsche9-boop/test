import {api,logout} from "./api.js";
export const state={user:null,inventory:[],shop:[],pass:null,dailies:[]};
export async function refresh(){if(!localStorage.getItem("arcadeverse_token"))return false;try{const r=await api("/me");state.user=r.user;state.inventory=r.inventory;state.shop=await api("/shop");state.pass=await api("/pass");state.dailies=await api("/dailies");return true}catch{logout();return false}}

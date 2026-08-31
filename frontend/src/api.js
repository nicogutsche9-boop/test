const API=(import.meta.env.VITE_API_URL||"http://localhost:4000/api").replace(/\/$/,"");
let token=localStorage.getItem("arcadeverse_token");
export function setToken(t){token=t;if(t)localStorage.setItem("arcadeverse_token",t);else localStorage.removeItem("arcadeverse_token")}
export async function api(path,options={}){const res=await fetch(API+path,{...options,headers:{"Content-Type":"application/json",...(options.headers||{}),...(token?{Authorization:`Bearer ${token}`}:{})}});const data=await res.json().catch(()=>({}));if(!res.ok)throw new Error(data.error||"API Fehler");return data}
export async function register(data){const r=await api("/auth/register",{method:"POST",body:JSON.stringify(data)});setToken(r.token);return r}
export async function login(data){const r=await api("/auth/login",{method:"POST",body:JSON.stringify(data)});setToken(r.token);return r}
export function logout(){setToken(null)}

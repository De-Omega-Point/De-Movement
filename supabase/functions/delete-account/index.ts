import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const cors={
  "Access-Control-Allow-Origin":"*",
  "Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods":"POST, OPTIONS",
  "Content-Type":"application/json"
};

function envKey(modern:string,legacy:string){
  const old=Deno.env.get(legacy);
  if(old)return old;
  try{
    const parsed=JSON.parse(Deno.env.get(modern)||"{}");
    return parsed.default||Object.values(parsed)[0]||"";
  }catch{return ""}
}

Deno.serve(async req=>{
  if(req.method==="OPTIONS")return new Response("ok",{headers:cors});
  if(req.method!=="POST")return new Response(JSON.stringify({error:"method_not_allowed"}),{status:405,headers:cors});

  const auth=req.headers.get("Authorization");
  if(!auth)return new Response(JSON.stringify({error:"authentication_required"}),{status:401,headers:cors});

  let body:any={};
  try{body=await req.json()}catch{}
  if(body?.confirm!=="DELETE")return new Response(JSON.stringify({error:"confirmation_required"}),{status:400,headers:cors});

  const url=Deno.env.get("SUPABASE_URL")!;
  const publicKey=envKey("SUPABASE_PUBLISHABLE_KEYS","SUPABASE_ANON_KEY");
  const secretKey=envKey("SUPABASE_SECRET_KEYS","SUPABASE_SERVICE_ROLE_KEY");
  if(!url||!publicKey||!secretKey)return new Response(JSON.stringify({error:"server_configuration"}),{status:500,headers:cors});

  const userClient=createClient(url,publicKey,{global:{headers:{Authorization:auth}},auth:{persistSession:false}});
  const admin=createClient(url,secretKey,{auth:{persistSession:false,autoRefreshToken:false}});

  const {data:userData,error:userError}=await userClient.auth.getUser();
  const user=userData.user;
  if(userError||!user)return new Response(JSON.stringify({error:"invalid_session"}),{status:401,headers:cors});

  const {data:profile,error:profileError}=await admin.from("profiles").select("id,role,account_status").eq("id",user.id).maybeSingle();
  if(profileError||!profile)return new Response(JSON.stringify({error:"profile_not_found"}),{status:404,headers:cors});

  if(profile.role==="administrator"&&profile.account_status==="active"){
    const {count,error:countError}=await admin.from("profiles").select("id",{count:"exact",head:true}).eq("role","administrator").eq("account_status","active");
    if(countError)return new Response(JSON.stringify({error:"administrator_check_failed"}),{status:500,headers:cors});
    if((count||0)<=1)return new Response(JSON.stringify({error:"last_administrator"}),{status:409,headers:cors});
  }

  const {error:deleteError}=await admin.auth.admin.deleteUser(user.id);
  if(deleteError)return new Response(JSON.stringify({error:"delete_failed"}),{status:500,headers:cors});
  return new Response(JSON.stringify({deleted:true}),{status:200,headers:cors});
});
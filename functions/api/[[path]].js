/**
 * Cloudflare Functions API Handler
 * 处理所有 /api/* 路由请求
 */

import { handleRequest } from "../main.js";
import {
  createStorage,
  isCloudflareEnvironment,
} from "../core/cloudflare-storage.js";

export async function onRequest(context) {
  const { request, env, ctx } = context;

  try {
    // 初始化 Cloudflare 存储
    if (isCloudflareEnvironment()) {
      const storage = createStorage(env);
      if (storage) {
        // 初始化数据库表（首次运行）
        await storage.initTables();

        // 将存储实例添加到全局环境
        globalThis.CLOUDFLARE_STORAGE = storage;
      }
    }

    // 设置环境变量
    if (env) {
      process.env.SUB_STORE_KV = "cloudflare-kv";
      process.env.SUB_STORE_DB = "cloudflare-d1";
      process.env.SUB_STORE_BACKEND_API_HOST = "0.0.0.0";
      process.env.SUB_STORE_BACKEND_API_PORT = "3000";
      process.env.SUB_STORE_FRONTEND_BACKEND_PATH = "/api";
      process.env.SUB_STORE_DATA_BASE_PATH = "/data";
      process.env.NODE_ENV = "production";
    }

    // 处理 CORS
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers":
            "Content-Type, Authorization, X-Requested-With",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    // 创建 Express 兼容的请求对象
    const url = new URL(request.url);
    const expressReq = {
      method: request.method,
      url: url.pathname + url.search,
      path: url.pathname,
      query: Object.fromEntries(url.searchParams),
      headers: Object.fromEntries(request.headers),
      body:
        request.method !== "GET" && request.method !== "HEAD"
          ? await request.text()
          : undefined,
      params: {},
      get: (header) => request.headers.get(header),
    };

    // 创建 Express 兼容的响应对象
    let responseBody = "";
    let responseStatus = 200;
    let responseHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers":
        "Content-Type, Authorization, X-Requested-With",
      "Content-Type": "application/json; charset=utf-8",
    };

    const expressRes = {
      status: (code) => {
        responseStatus = code;
        return expressRes;
      },
      json: (data) => {
        responseBody = JSON.stringify(data);
        return expressRes;
      },
      send: (data) => {
        responseBody = typeof data === "string" ? data : JSON.stringify(data);
        return expressRes;
      },
      set: (name, value) => {
        if (typeof name === "object") {
          Object.assign(responseHeaders, name);
        } else {
          responseHeaders[name] = value;
        }
        return expressRes;
      },
      header: (name, value) => expressRes.set(name, value),
      type: (type) => {
        responseHeaders["Content-Type"] = type;
        return expressRes;
      },
      end: (data) => {
        if (data) responseBody = data;
        return expressRes;
      },
    };

    // 调用主处理函数
    await handleRequest(expressReq, expressRes);

    // 返回 Cloudflare Response
    return new Response(responseBody, {
      status: responseStatus,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("Cloudflare Function error:", error);

    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
}

// 处理所有 HTTP 方法
export const onRequestGet = onRequest;
export const onRequestPost = onRequest;
export const onRequestPut = onRequest;
export const onRequestDelete = onRequest;
export const onRequestPatch = onRequest;
export const onRequestHead = onRequest;
export const onRequestOptions = onRequest;

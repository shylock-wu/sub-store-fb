/**
 * Cloudflare Pages 健康检查端点
 * 访问 /api/health 来验证部署状态
 */

export async function onRequestGet(context) {
  const { env } = context;

  try {
    // 检查环境配置
    const checks = {
      kv: !!env.SUB_STORE_KV,
      d1: !!env.SUB_STORE_DB,
      environment: "cloudflare-pages",
      timestamp: new Date().toISOString(),
      version: "2.0.0-cloudflare",
    };

    // 测试 KV 连接
    if (env.SUB_STORE_KV) {
      try {
        await env.SUB_STORE_KV.put("health-check", "ok", { expirationTtl: 60 });
        const kvTest = await env.SUB_STORE_KV.get("health-check");
        checks.kvConnection = kvTest === "ok";
      } catch (error) {
        checks.kvConnection = false;
        checks.kvError = error.message;
      }
    }

    // 测试 D1 连接
    if (env.SUB_STORE_DB) {
      try {
        const result = await env.SUB_STORE_DB.prepare(
          "SELECT 1 as test"
        ).first();
        checks.d1Connection = result?.test === 1;
      } catch (error) {
        checks.d1Connection = false;
        checks.d1Error = error.message;
      }
    }

    const allHealthy =
      checks.kv &&
      checks.d1 &&
      checks.kvConnection !== false &&
      checks.d1Connection !== false;

    return new Response(
      JSON.stringify({
        status: allHealthy ? "healthy" : "unhealthy",
        checks,
      }),
      {
        status: allHealthy ? 200 : 503,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        status: "error",
        error: error.message,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
}

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Supabase 配置
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('错误: 请在 .env 文件中配置 SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

// 创建 Supabase 客户端（使用 service_role key，拥有完全权限）
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    },
    db: {
        schema: 'public'
    },
    global: {
        headers: {
            'x-client-info': 'project-management-system'
        }
    }
});

// 测试数据库连接
async function testConnection() {
    try {
        const { data, error } = await supabase.from('users').select('count');
        if (error) {
            console.error('数据库连接测试失败:', error.message);
            return false;
        }
        console.log('✓ Supabase 数据库连接成功');
        return true;
    } catch (err) {
        console.error('数据库连接测试出错:', err.message);
        return false;
    }
}

module.exports = {
    supabase,
    testConnection
};

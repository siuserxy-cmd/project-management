#!/usr/bin/env node

/**
 * Supabase 配置检查和测试脚本
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

console.log('='.repeat(60));
console.log('Supabase 配置检查工具');
console.log('='.repeat(60));
console.log('');

// 检查环境变量
console.log('1️⃣  检查环境变量...');
console.log('');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let hasErrors = false;

if (!supabaseUrl) {
    console.log('❌ SUPABASE_URL 未配置');
    hasErrors = true;
} else if (!supabaseUrl.startsWith('https://')) {
    console.log('❌ SUPABASE_URL 格式错误，应该以 https:// 开头');
    console.log(`   当前值: ${supabaseUrl}`);
    hasErrors = true;
} else {
    console.log(`✅ SUPABASE_URL: ${supabaseUrl}`);
}

if (!supabaseAnonKey) {
    console.log('❌ SUPABASE_ANON_KEY 未配置');
    hasErrors = true;
} else if (!supabaseAnonKey.startsWith('eyJ')) {
    console.log('❌ SUPABASE_ANON_KEY 格式错误，应该以 eyJ 开头');
    hasErrors = true;
} else {
    console.log(`✅ SUPABASE_ANON_KEY: ${supabaseAnonKey.substring(0, 20)}...`);
}

if (!supabaseServiceKey) {
    console.log('❌ SUPABASE_SERVICE_ROLE_KEY 未配置');
    hasErrors = true;
} else if (!supabaseServiceKey.startsWith('eyJ')) {
    console.log('❌ SUPABASE_SERVICE_ROLE_KEY 格式错误，应该以 eyJ 开头');
    hasErrors = true;
} else {
    console.log(`✅ SUPABASE_SERVICE_ROLE_KEY: ${supabaseServiceKey.substring(0, 20)}...`);
}

console.log('');

if (hasErrors) {
    console.log('⚠️  环境变量配置有误，请检查 .env 文件');
    console.log('');
    console.log('请在 Supabase 控制台获取正确的配置:');
    console.log('1. 访问 https://supabase.com/dashboard');
    console.log('2. 选择您的项目');
    console.log('3. 点击 Settings → API');
    console.log('4. 复制 Project URL 和 API Keys');
    console.log('');
    process.exit(1);
}

// 测试数据库连接
console.log('2️⃣  测试数据库连接...');
console.log('');

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function testConnection() {
    try {
        // 测试基本连接
        const { data, error } = await supabase
            .from('users')
            .select('count', { count: 'exact', head: true });

        if (error) {
            console.log('❌ 数据库连接失败:', error.message);
            console.log('');
            console.log('可能的原因:');
            console.log('1. Supabase 项目尚未创建数据表');
            console.log('2. 网络连接问题');
            console.log('3. API 密钥错误');
            console.log('');
            console.log('解决方案:');
            console.log('- 请在 Supabase SQL Editor 中执行 scripts/supabase-init.sql');
            console.log('- 检查网络连接');
            console.log('- 验证 API 密钥是否正确');
            process.exit(1);
        }

        console.log('✅ 数据库连接成功!');
        console.log('');

        // 检查表结构
        console.log('3️⃣  检查数据表...');
        console.log('');

        const tables = [
            'users',
            'customers',
            'writers',
            'projects',
            'timeline',
            'project_files',
            'project_notes'
        ];

        let allTablesExist = true;

        for (const table of tables) {
            const { error } = await supabase
                .from(table)
                .select('count', { count: 'exact', head: true });

            if (error) {
                console.log(`❌ 表 ${table} 不存在`);
                allTablesExist = false;
            } else {
                console.log(`✅ 表 ${table} 存在`);
            }
        }

        console.log('');

        if (!allTablesExist) {
            console.log('⚠️  部分数据表不存在');
            console.log('');
            console.log('请执行以下步骤:');
            console.log('1. 打开 Supabase 控制台的 SQL Editor');
            console.log('2. 复制 scripts/supabase-init.sql 的内容');
            console.log('3. 粘贴并执行');
            console.log('');
            process.exit(1);
        }

        // 检查示例数据
        console.log('4️⃣  检查示例数据...');
        console.log('');

        const { data: users, error: usersError } = await supabase
            .from('users')
            .select('*');

        if (usersError) {
            console.log('❌ 无法读取用户数据:', usersError.message);
        } else {
            console.log(`✅ 用户表有 ${users.length} 条记录`);
            if (users.length > 0) {
                users.forEach(user => {
                    console.log(`   - ${user.username} (${user.role})`);
                });
            }
        }

        console.log('');

        const { data: projects, error: projectsError } = await supabase
            .from('projects')
            .select('*');

        if (projectsError) {
            console.log('❌ 无法读取项目数据:', projectsError.message);
        } else {
            console.log(`✅ 项目表有 ${projects.length} 条记录`);
        }

        console.log('');
        console.log('='.repeat(60));
        console.log('🎉 所有检查通过！Supabase 配置正确！');
        console.log('='.repeat(60));
        console.log('');
        console.log('您现在可以启动服务器:');
        console.log('  npm start');
        console.log('');
        console.log('或使用 Supabase 版本:');
        console.log('  node server-supabase.js');
        console.log('');

    } catch (err) {
        console.log('❌ 发生错误:', err.message);
        console.log('');
        console.log('请检查:');
        console.log('1. 网络连接是否正常');
        console.log('2. Supabase 项目是否处于活动状态');
        console.log('3. .env 配置是否正确');
        process.exit(1);
    }
}

testConnection();

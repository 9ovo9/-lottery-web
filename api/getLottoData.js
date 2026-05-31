// api/getLottoData.js

// 这是一个 Vercel Serverless Function.
// 它会处理所有的数据抓取逻辑，并向上游（我们的前端页面）提供一个干净、稳定的API。

// 使用node-fetch来发送网络请求
const fetch = require('node-fetch');

module.exports = async (req, res) => {
    // 目标API
    const url = 'https://api.caipiao.163.com/award_home/dlt.html?gameEn=dlt&count=50';

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch data, status: ${response.status}`);
        }
        const lotteryInfo = await response.json();

        if (!lotteryInfo || !lotteryInfo.awardInfoList || lotteryInfo.awardInfoList.length === 0) {
            throw new Error('Invalid data structure from source API');
        }

        const parsedData = lotteryInfo.awardInfoList.map(item => {
            const numbers = item.awardNumber.split(' ');
            return {
                issue: item.period,
                red: numbers.slice(0, 5),
                blue: numbers.slice(5)
            };
        });

        // 设置响应头，允许跨域访问（对于Vercel来说这是最佳实践）
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cache-Control', 's-maxage=43200, stale-while-revalidate'); // 12小时缓存

        // 发送成功响应
        res.status(200).json(parsedData);

    } catch (error) {
        console.error(error);
        // 发送错误响应
        res.status(500).json({ error: 'Failed to fetch lottery data.', details: error.message });
    }
};

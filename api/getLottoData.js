// api/getLottoData.js
// Vercel Serverless Function to fetch lottery data.

import fetch from 'node-fetch';

export default async (req, res) => {
    // 使用专业的、公开的彩票API
    const url = 'http://www.lotteryapi.com/api/dlt';

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch data, status: ${response.status}`);
        }
        const lotteryInfo = await response.json();

        // 检查返回的数据结构是否正确
        if (!lotteryInfo || !lotteryInfo.data || lotteryInfo.data.length === 0) {
            throw new Error('Invalid data structure from source API');
        }

        // 解析新API返回的数据
        const parsedData = lotteryInfo.data.map(item => {
            return {
                issue: item.expect,
                red: item.openCode.split('+')[0].split(','),
                blue: item.openCode.split('+')[1].split(',')
            };
        });

        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cache-Control', 's-maxage=43200, stale-while-revalidate'); // 12-hour cache
        res.status(200).json(parsedData);

    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({ error: 'Failed to fetch lottery data.', details: error.message });
    }
};

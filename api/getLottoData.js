// api/getLottoData.js
// Vercel Serverless Function to fetch lottery data.

import fetch from 'node-fetch';

export default async (req, res) => {
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

        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cache-Control', 's-maxage=43200, stale-while-revalidate'); // 12-hour cache
        res.status(200).json(parsedData);

    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({ error: 'Failed to fetch lottery data.', details: error.message });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    // 1. DOM Element and Global Variable Declarations
    const generateBtn = document.getElementById('generate-btn');
    const resultDiv = document.getElementById('result');
    const historyTableBody = document.querySelector('#history-table tbody');
    const trendsChartCanvas = document.getElementById('trends-chart');
    const dataStatus = document.getElementById('data-status');
    let trendsChart = null;
    let lotteryData = [];

    // 2. Function Definitions

    async function fetchRealData() {
        const url = '/api/getLottoData';
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Network response was not ok, status: ${response.status}`);
            }
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Failed to fetch data from our own API:', error);
            dataStatus.textContent = `错误: ${error.message}`;
            return [];
        }
    }

    function renderHistory(data) {
        historyTableBody.innerHTML = '';
        data.forEach(item => {
            const row = `<tr><td>${item.issue}</td><td>${item.red.join(', ')}</td><td>${item.blue.join(', ')}</td></tr>`;
            historyTableBody.innerHTML += row;
        });
    }

    function analyzeTrends(data) {
        const redCounts = {}, blueCounts = {};
        for (let i = 1; i <= 35; i++) redCounts[String(i).padStart(2, '0')] = 0;
        for (let i = 1; i <= 12; i++) blueCounts[String(i).padStart(2, '0')] = 0;
        data.forEach(item => {
            item.red.forEach(num => redCounts[num]++);
            item.blue.forEach(num => blueCounts[num]++);
        });
        const sortNumbersByFrequency = (counts) => Object.entries(counts).sort(([, a], [, b]) => b - a).map(([num]) => num);
        const sortedRed = sortNumbersByFrequency(redCounts);
        const sortedBlue = sortNumbersByFrequency(blueCounts);
        return {
            red: { hot: sortedRed.slice(0, 12), warm: sortedRed.slice(12, 23), cold: sortedRed.slice(23) },
            blue: { hot: sortedBlue.slice(0, 4), warm: sortedBlue.slice(4, 8), cold: sortedBlue.slice(8) }
        };
    }

    function getRandomElements(arr, n) {
        return [...arr].sort(() => 0.5 - Math.random()).slice(0, n);
    }

    function generateNumbers() {
        if (lotteryData.length === 0) {
            resultDiv.innerHTML = '数据不可用，无法生成号码。';
            return;
        }
        const trends = analyzeTrends(lotteryData);
        let redNumbers, isValid = false, attempts = 0;
        while (!isValid && attempts < 1000) {
            const tempReds = [...getRandomElements(trends.red.hot, 2), ...getRandomElements(trends.red.warm, 2), ...getRandomElements(trends.red.cold, 1)];
            const sum = tempReds.reduce((acc, num) => acc + parseInt(num), 0);
            const oddCount = tempReds.filter(num => parseInt(num) % 2 !== 0).length;
            const bigCount = tempReds.filter(num => parseInt(num) >= 18).length;
            if (sum >= 80 && sum <= 120 && (oddCount === 3 || oddCount === 2) && (bigCount === 3 || bigCount === 2)) {
                redNumbers = tempReds;
                isValid = true;
            }
            attempts++;
        }
        if (!isValid) {
            redNumbers = [...getRandomElements(trends.red.hot, 2), ...getRandomElements(trends.red.warm, 2), ...getRandomElements(trends.red.cold, 1)];
        }
        const blueNumbers = [...getRandomElements(trends.blue.hot, 1), ...getRandomElements(trends.blue.cold, 1)];
        redNumbers.sort((a, b) => parseInt(a) - parseInt(b));
        blueNumbers.sort((a, b) => parseInt(a) - parseInt(b));
        resultDiv.innerHTML = `<span style="color: red;">${redNumbers.join(' ')}</span> + <span style="color: blue;">${blueNumbers.join(' ')}</span>`;
    }

    function renderTrendsChart(data) {
        if (data.length === 0) return;
        const redCounts = {}, blueCounts = {};
        for (let i = 1; i <= 35; i++) redCounts[String(i).padStart(2, '0')] = 0;
        for (let i = 1; i <= 12; i++) blueCounts[String(i).padStart(2, '0')] = 0;
        data.forEach(item => {
            item.red.forEach(num => redCounts[num]++);
            item.blue.forEach(num => blueCounts[num]++);
        });
        const sortedRedLabels = Object.keys(redCounts).sort((a, b) => parseInt(a) - parseInt(b));
        const sortedBlueLabels = Object.keys(blueCounts).sort((a, b) => parseInt(a) - parseInt(b));
        const sortedRedData = sortedRedLabels.map(label => redCounts[label]);
        const sortedBlueData = sortedBlueLabels.map(label => blueCounts[label]);
        if (trendsChart) trendsChart.destroy();
        trendsChart = new Chart(trendsChartCanvas, {
            type: 'bar',
            data: {
                labels: [...sortedRedLabels, ...sortedBlueLabels],
                datasets: [{
                    label: '号码出现次数',
                    data: [...sortedRedData, ...sortedBlueData],
                    backgroundColor: [...Array(35).fill('rgba(255, 99, 132, 0.2)'), ...Array(12).fill('rgba(54, 162, 235, 0.2)')],
                    borderColor: [...Array(35).fill('rgba(255, 99, 132, 1)'), ...Array(12).fill('rgba(54, 162, 235, 1)')],
                    borderWidth: 1
                }]
            },
            options: {
                scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
                plugins: { legend: { display: false } },
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }

    async function init() {
        dataStatus.textContent = '正在获取最新数据...';
        lotteryData = await fetchRealData();
        if (lotteryData.length > 0) {
            dataStatus.textContent = '数据加载成功！';
            renderHistory(lotteryData);
            renderTrendsChart(lotteryData);
            generateNumbers();
        } else {
            dataStatus.textContent = '数据加载失败，请检查后台或刷新。';
        }
    }

    // 3. Initial Execution
    generateBtn.addEventListener('click', generateNumbers);
    init();
});

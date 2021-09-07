<template>
  <div class="row">
    <div class="col-sm-12">
      <div id="chart_main" style="width: 800px;">
        <canvas id="line_chart"></canvas>
        <button id="download_button" class="btn-square-pop">Line chart DL</button>
        <a id="download_link"></a>
      </div>
    </div>
  </div>
  <div id="pie_chart_main" class="row mt-2">
  </div>
</template>

<script>

import Chart from 'chart.js/auto';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import axios from 'axios'
Chart.register(ChartDataLabels);

export default {
  methods: {
    async renderChart() {
      const line_chart = document.getElementById("line_chart");
      
      // データ取得
      const chart_data = await axios.post("https://qylg.miruo.net/api");
      
      // 持ち株(折れ線)グラフ
      new Chart(line_chart, chart_data.data.body.line_chart);

      // ダウンロード
      const button = document.getElementById('download_button');
      const downloadLink = document.getElementById('download_link');
      button.addEventListener('click', function(){
        downloadLink.href = line_chart.toDataURL('image/png');
        downloadLink.download = 'chart.png';
        downloadLink.click();
      });

      // 円グラフ
      const pie_chart_main = document.getElementById("pie_chart_main");
      // チームごとにループ
      const pie_charts = chart_data.data.body.pie_charts;
      const pie_charts_length = pie_charts.length;
      for(let i=0; i < pie_charts_length; i++){
        const new_chart = document.createElement('canvas')
        const chart_id = 'pie_chart_' + i
        const new_div = document.createElement('div')
        new_div.id = chart_id + '_d'
        new_div.setAttribute('class', 'col-sm-3 p-2')
        pie_chart_main.appendChild(new_div);
        const chart_div = document.getElementById(chart_id + '_d');
        new_chart.id = chart_id;
        chart_div.appendChild(new_chart);
        const pie_chart = document.getElementById(chart_id);
        // 値を常に表示
        pie_charts[i].options.plugins.datalabels.formatter = (value, ctx) => {
            const label = ctx.chart.data.labels[ctx.dataIndex];
            const datasets_data = ctx.chart.data.datasets[0].data;
            const stock_list = ctx.chart.options.plugins.stock_list;
            const have_stocks = stock_list[label];
            const total = datasets_data.reduce(function(sum, element){
              return sum + Number(element);
            }, 0);
            const ratio = Math.floor(value / total * 10000) / 100;
            // ティッカー 金額 持ち株数 比率 を表示
            return label + '\n\\' + String(value).replace( /(\d)(?=(\d\d\d)+(?!\d))/g, '$1,') + '\n' + have_stocks + 'shares' + '\n' + ratio + '%';
        }
        // ドーナツチャート表示
        new Chart(pie_chart, pie_charts[i]);

      }
    }
  },
  mounted() {
    this.renderChart();
  }
};

</script>

<style scoped>
.btn-square-pop {
  position: relative;
  display: inline-block;
  padding: 0.25em 0.5em;
  text-decoration: none;
  color: #FFF;
  background: #fd9535;
  border-bottom: solid 2px #d27d00;
  border-radius: 4px;
  box-shadow: inset 0 2px 0 rgba(255,255,255,0.2), 0 2px 2px rgba(0, 0, 0, 0.19);
  font-weight: bold;
}

.btn-square-pop:active {
  border-bottom: solid 2px #fd9535;
  box-shadow: 0 0 2px rgba(0, 0, 0, 0.30);
}

</style>
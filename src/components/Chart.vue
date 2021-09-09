<template>
  <div class="row">
    <img src="@/assets/img/0title.png" class="fade-in" alt="0title">
  </div>
  <div class="row">
    <img src="@/assets/img/1lists.png" class="fade-in" alt="1lists">
  </div>
  <div class="row">
    <div class="col-sm-12">
      <div id="comp_table" class="fade-in" style="width: 1000px;">
      </div>
      <button id="table_download_button" class="btn-download d-none"><i class="fas fa-camera-retro"></i></button>
    </div>
  </div>
  <div class="row">
    <img src="@/assets/img/2charts.png" class="fade-in" alt="2charts">
  </div>
  <div class="row">
    <div class="col-sm-12">
      <div id="line_chart_main" style="width: 1000px;">
        <canvas id="line_chart"></canvas>
        <button id="download_button" class="btn-download d-none"><i class="fas fa-camera-retro"></i></button>
        <a id="download_link"></a>
      </div>
    </div>
  </div>
  <div class="row">
    <img src="@/assets/img/3graph.png" class="fade-in" alt="3graph">
  </div>
  <div id="dividend_chart_main" class="row mt-2">
    <div class="col-sm-12">
      <div style="width: 1000px;">
        <canvas id="dividend_chart"></canvas>
        <button id="download_button2" class="btn-download d-none"><i class="fas fa-camera-retro"></i></button>
        <a id="download_link2"></a>
      </div>
    </div>
  </div>
  <div class="row">
    <img src="@/assets/img/4portfolio.png" class="fade-in" alt="4portfolio">
  </div>
  <div id="pie_chart_main" class="row mt-2">
    <a id="pie_dl_link"></a>
  </div>
</template>

<script>

import { Grid } from "gridjs";
import "gridjs/dist/theme/mermaid.css";

import html2canvas from 'html2canvas';

import Chart from 'chart.js/auto';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import axios from 'axios'

Chart.register(ChartDataLabels);

export default {
  methods: {
    async renderChart() {
      const line_chart = document.getElementById("line_chart");
      
      // データ取得
      const response = await axios.post("https://qylg.miruo.net/api");
      
      if(response.data.statusCode == 200){
        // 前日比比較表
        const table_data = response.data.body.line_chart.data.datasets.reduce(function (accumulator, currentValue) {
          const first_value = Math.floor(currentValue.data[0])
          const yesterday_value = Math.floor(currentValue.data.slice(-3)[0])
          const today_value = Math.floor(currentValue.data.slice(-2)[0])
          const difference = today_value - yesterday_value
          const comparison = Math.floor(((today_value / yesterday_value) - 1) * 10000) / 100
          const profit_and_loss = today_value - first_value
          const pal_comparison = Math.floor(((today_value / first_value) - 1) * 10000) / 100
          const plusminus = comparison > 0 ? "+" : ""
          const pal_plusminus = pal_comparison > 0 ? "+" : ""
          accumulator.data.push([
            currentValue.label,
            String(yesterday_value).replace( /(\d)(?=(\d\d\d)+(?!\d))/g, '$1,'),
            String(today_value).replace( /(\d)(?=(\d\d\d)+(?!\d))/g, '$1,'),
            String(difference).replace( /(\d)(?=(\d\d\d)+(?!\d))/g, '$1,') + "(" + plusminus + comparison + '%' + ")",
            String(profit_and_loss).replace( /(\d)(?=(\d\d\d)+(?!\d))/g, '$1,') + "(" + pal_plusminus + pal_comparison + '%' + ")",
          ])
          return accumulator
        }, {data:[]})
        
        // テーブルを画像でダウンロード
        const table_download_button = document.getElementById("table_download_button");
        table_download_button.addEventListener("click",() => {
          html2canvas(document.querySelector("#comp_table")).then(canvas => { 
              let downloadEle = document.createElement("a");
              downloadEle.href = canvas.toDataURL("image/png");
              downloadEle.download = "table.png";
              downloadEle.click();
          });
        })

        new Grid({
          columns: [
            {name: "team", width: '320px'},
            {name: "yesterday", width: '150px'},
            {name: "today", width: '150px'},
            {name: "difference", width: '190px'},
            {name: "profit and loss", width: '190px'}
          ],
          sort: true,
          data: table_data.data,
            style: {
              table: {
                'border': '1px solid #000'
              },
              th: {
                'background-color': '#021A29',
                'color': '#fff',
                'border': '1px solid #000'
              },
              td: {
                'background-color': '#000F17',
                'border': '1px solid #000',
                'color': '#A1B5C2'
              }
            }
        }).render(document.getElementById("comp_table"));
        
        // グリッドの値が取得できない場合があるのでスリープ
        const _sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
        await _sleep(300);
        // 前日比、当初比の色変更
        const comp_table_body = document.querySelectorAll("#comp_table tbody");
        for(let i = 0;i < comp_table_body[0].children.length;i++){
          const columns = comp_table_body[0].children[i].children
          // 前日比
          if(columns[3].innerText.includes('+')){
            // プラスの場合
            columns[3].style.color = "red"
          }
          else{
            // マイナスの場合
            columns[3].style.color = "green"
          }
          // 当初比
          if(columns[4].innerText.includes('+')){
            // プラスの場合
            columns[4].style.color = "red"
          }
          else{
            // マイナスの場合
            comp_table_body[0].children[i].children[4].style.color = "green"
          }
        }
        
        // テーブルを表示
        const comp_table = document.getElementById("comp_table")
        comp_table.classList.remove('d-none');
        
        const line_plugin = {
          beforeDraw: (chart) => {
            const ctx = chart.canvas.getContext('2d');
            ctx.save();
            ctx.globalCompositeOperation = 'destination-over';
            ctx.fillStyle = '#14202B';
            ctx.fillRect(0, 0, chart.width, chart.height);
            ctx.restore();
          },
          responsive: true,
          usePointStyle: true
        };
        response.data.body.line_chart.plugins = [line_plugin]

        // 持ち株(折れ線)グラフ
        new Chart(line_chart, response.data.body.line_chart);

        // ダウンロード
        const button = document.getElementById('download_button');
        const downloadLink = document.getElementById('download_link');
        button.addEventListener('click', function(){
          downloadLink.href = line_chart.toDataURL('image/png');
          downloadLink.download = 'chart.png';
          downloadLink.click();
        });

        const dividend_chart = document.getElementById("dividend_chart");
        const dividend_plugin = {
          beforeDraw: (chart) => {
            const ctx = chart.canvas.getContext('2d');
            ctx.save();
            ctx.globalCompositeOperation = 'destination-over';
            ctx.fillStyle = '#14202B';
            ctx.fillRect(0, 0, chart.width, chart.height);
            ctx.restore();
          },
          responsive: true
        };
        response.data.body.dividend_chart.plugins = [dividend_plugin]

        // 集合棒グラフ
        new Chart(dividend_chart, response.data.body.dividend_chart);
        // ダウンロード
        const button2 = document.getElementById('download_button2');
        const downloadLink2 = document.getElementById('download_link2');
        button2.addEventListener('click', function(){
          downloadLink2.href = dividend_chart.toDataURL('image/png');
          downloadLink2.download = 'chart.png';
          downloadLink2.click();
        });

        // 円グラフ
        const pie_chart_main = document.getElementById("pie_chart_main");
        // チームごとにループ
        const pie_charts = response.data.body.pie_charts;
        const pie_charts_length = pie_charts.length;
        for(let i=0; i < pie_charts_length; i++){
          const chart_id = 'pie_chart_' + i
          const div_id = chart_id + '_div'
          const dl_btn_id = chart_id + '_btn'
          
          // 親div要素を作成
          let new_div = document.createElement('div')
          new_div.id = div_id
          new_div.setAttribute('class', 'col-sm-3 p-2')
          pie_chart_main.appendChild(new_div);
          
          // チャート追加
          const new_chart = document.createElement('canvas')
          new_chart.id = chart_id;
          new_div.appendChild(new_chart);

          // DLボタン追加
          new_div = document.getElementById(div_id);
          const dl_btn = document.createElement('button')
          dl_btn.id = dl_btn_id
          dl_btn.setAttribute('class', 'btn-download')
          new_div.appendChild(dl_btn);
          
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
              const unit = label == 'USDJPY' ? 'dollars' : 'shares'
              // ティッカー 金額 持ち株数 比率 を表示
              return label + '\n' + String(value).replace( /(\d)(?=(\d\d\d)+(?!\d))/g, '$1,') + 'yen' + '\n' + have_stocks + unit + '\n' + ratio + '%';
          }

          let pie_plugin = {
            beforeDraw: (chart) => {
              const ctx = chart.canvas.getContext('2d');
              ctx.save();
              ctx.globalCompositeOperation = 'destination-over';
              ctx.fillStyle = '#14202B';
              ctx.fillRect(0, 0, chart.width, chart.height);
              ctx.restore();
            }
          };
          pie_charts[i].plugins = [pie_plugin]

          // ドーナツチャート表示
          const pie_chart = document.getElementById(chart_id);
          new Chart(pie_chart, pie_charts[i]);

          // DLの設定
          const btn = document.getElementById(dl_btn_id);
          const icon = document.createElement('i') // アイコンを設定
          icon.setAttribute('class', 'fas fa-camera-retro')
          btn.appendChild(icon);
          const pie_dl_link = document.getElementById('pie_dl_link');
          btn.addEventListener('click', function(){
            pie_dl_link.href = pie_chart.toDataURL('image/png');
            pie_dl_link.download = 'chart.png';
            pie_dl_link.click();
          });
        }

        // ダウンロードボタン表示
        table_download_button.classList.remove('d-none');
        button.classList.remove('d-none');
        button2.classList.remove('d-none');
        // 背景色変更
        document.getElementById('app').style.backgroundColor = '#14202B';

      }
    }
  },
  mounted() {
    this.renderChart();
  }
};

</script>

<style>
.btn-download {
  background-color: #000;
  border: 1px solid #333;
  color: #E2E0E7;
  transition-duration: 0.5s;
}
.btn-download:hover {
  background-color: #fff;
  color: #000;
}

.fade-in{ 
  animation-name: fadein;
  animation-duration:3s; 
}
@keyframes fadein {
  0% {
    opacity: 0;
    transform: translateY(-30px);
  }
  100% {
    opacity:1;
    transform: translateY(0);
  } 
}
</style>
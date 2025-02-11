// ==UserScript==
// @name        Every Page Map 💢
// @namespace        http://tampermonkey.net/
// @version        4.0
// @description        「記事の編集・削除」ページで全記事の「公開設定」を記録する
// @author        Ameba Blog User
// @match        https://blog.ameba.jp/ucs/entry/srventrylist*
// @icon        https://www.google.com/s2/favicons?sz=64&domain=ameba.jp
// @run-at        document-start
// @updateURL        https://github.com/personwritep/Every_Page_Map/raw/main/Every_Page_Map.user.js
// @downloadURL        https://github.com/personwritep/Every_Page_Map/raw/main/Every_Page_Map.user.js
// ==/UserScript==


let retry=0;
let interval=setInterval(wait_target, 1);
function wait_target(){
    retry++;
    if(retry>100){ // リトライ制限 100回 0.1secまで
        clearInterval(interval); }
    let target=document.documentElement; // 監視 target
    if(target){
        clearInterval(interval);
        style_in(); }}


let blogDB={}; // 記事ID 投稿フラグ 投稿年月 の配列
let entry_id_DB; // ID検索用の配列
let blogMAP={}; // 公開情報の件数データMAP

function write_MAP(){ // セッションストレージ MAP 保存
    let write_map_json=JSON.stringify(blogMAP);
    sessionStorage.setItem('blogMAP_back', write_map_json); }

function write_DB(){ // セッションストレージ DB 保存
    let write_json=JSON.stringify(blogDB);
    sessionStorage.setItem('blogDB_back', write_json); }



function style_in(){
    let read_json=sessionStorage.getItem('blogDB_back'); // ストレージ 保存名
    blogDB=JSON.parse(read_json);
    if(blogDB==null){
        blogDB=[['00000000000', 's', 0]]; } // 記事ID, 投稿フラグ, 投稿年月 6桁
    // 初要素のみ　 '00000000000' ドライブモード 's'/'c'/'e' 抽出表示指定 0～3
    if(blogDB[0][1]==0){ blogDB[0][1]='s'; } // 旧ファイルやトラブル時の救済


    let style=
        '<style id="EPS">'+
        '#globalHeader, #ucsHeader, #ucsMainLeft h1, .l-ucs-sidemenu-area, .selection-bar { '+
        'display: none !important; } '+

        '#ucsContent { width: 840px !important; }'+
        '#ucsContent::before { display: none; } '+
        '#ucsMain { margin-top: 15px; padding: 0 !important; } '+
        '#ucsMainLeft { width: 838px !important; padding: 0 15px; float: none; } '+

        '#entryYear { width: 120px !important; } '+
        '#entryMonth li, #entryMonth #nowMonthLi { '+
        'padding: 2px 0 0 !important; width: 55.2px; border: none; } '+
        '#entryMonth li a:visited { color: #3970B5 !important; } '+

        '#entryListEdit form { display: flex; flex-direction: column } #entrySort { order: -2 }'+
        '.pagingArea { order: -1; position: relative !important; left: 0 !important; top: 0 !important; '+
        'padding: 4px 30px 4px 0; margin-bottom: -33px; background: #ddedf3 !important }'+
        '.pagingArea a { border: 1px solid #888 } '+
        '.pagingArea .active { border: 2px solid #0066cc }'+
        '.pagingArea a, .pagingArea .active, .pagingArea .disabled { font-size: 14px; line-height: 23px }'+
        '#sorting { margin: 38px 0 4px; padding: 4px 10px; height: 110px; '+
        'font: 14px Meiryo; background: #ddedf3; height: auto !important; }'+
        '#sorting .pagingArea, #sorting select, #sorting ul { display: none }'+
        'input { font-family: meiryo; font-size: 14px }'+

        '#div1 { color: #333; margin: 10px -10px 0 15px; }'+
        '#div2 { color: #000; margin: 8px 15px; border: 1px solid #888; background: #fafcfd; }'+
        '#list_snap { padding: 2px 0 0; margin: 7px 40px 7px 0; width: 210px; }'+
        '#reset { padding: 2px 0 0; margin-right: 20px; width: 60px; }'+
        '#export { padding: 2px 0 0; margin: 7px 10px 7px 0; width: 150px; }'+
        '#import_sw { padding: 2px 0 0; margin: 7px 10px 7px 0; width: 115px; }'+
        '#import_result { display: inline-flex; padding: 2px 0 0; margin: 7px 0; width: 160px; '+
        'overflow: hidden; white-space: nowrap; }'+
        '#import { display: none; }'+
        '#snap_result { display: inline-block; margin: 6px 12px 4px; white-space: nowrap; }'+
        '#div3 { position: relative; color: #333; margin: 10px 15px; }'+
        '#show_map, #start_page, #do_snap { padding: 2px 10px 0; margin-right: 20px; width: auto; }'+
        '#amb_menu2 { float: right; padding: 2px 10px 0; margin: 2px 4px 3px -20px; cursor: pointer; }'+
        '#amb_menu3 { padding: 2px 10px 0; margin: 0 0 0 20px; cursor: pointer; } '+
        '.help_EPM { position: absolute; bottom: -6px; right: -12px; } '+

        '.div_add { display: flex; flex-direction: row; justify-content: space-evenly; width: 758px; '+
        'margin: 8px 15px; padding: 4px 0; border: 1px solid #777; background: #fafcfd; } '+
        '.m.y_index { width: 80px; font-size: 18px; text-align: center; outline: none !important; } '+
        '.m.y_index p { border: none; padding: 1px 4px 0; } '+
        '.m.y_index .yt { font-size: 14px; color: #1976d2; margin: 0 -3px 0 2px; } '+
        '.m.y_index .ypt { font-size: 11px; font-weight: normal; text-align: right; '+
        'margin: 0; padding: 5px 7px 0 0; background: none !important; } '+
        '.m { display: flex; flex-direction: column; font: bold 14px Meiryo; width: 50px; text-align: right; } '+
        '.m:hover { outline: 2px solid #2196f3; cursor: pointer; } '+
        '.mt { font-size: 13px; color: #3970bc; padding: 4px 0 0 !important; height: 22px; '+
        'margin-bottom: 3px; text-align: center; border: none !important; } '+
        '.m p { padding-right: 14px; margin-top: -1px; border: 1px solid #ccc; outline-offset: -2px; } '+
        '.m:not(.y_index) p:not(.mt):hover { outline: 2px solid #2196f3; position: relative; z-index: 1; } '+
        '#com1 { padding: 2px 20px 0; margin: 5px 15px; '+
        'font: 14px Meiryo; color: #fff; background: red; } '+
        '#com2 { position: absolute; right: 26px; top: 6px; padding: 1px 6px 0; '+
        'font: 14px Meiryo; color: #fff; background: #000; } '+

        'input[value="entry_ym=100001"] + #entrySort { visibility: hidden; } '+
        'input[value="entry_ym=100001"] ~ #entryList { visibility: hidden; } '+
        '</style>';

    if(blogDB[0][2]==4){ // 調査モード
        style +='<style>#div3 { display: none; }</style>'; }
    else if(blogDB[0][2]==5){ // 仮終了モード
        style= // 基本デザインを破棄
            '<style id="EPS">'+
            'body { background: #c5d8e1; }'+
            '#ucsMainLeft h1 { color: #2196f3; }'+
            '#div0, #div1, #div2, #div3 { display: none; }</style>';
        blogDB[0][2]=0;
        write_DB(); }
    else{ // MAP表示モード
        style +='<style>#div1, #div2 { display: none; }</style>'; }

    if(blogDB[0][2]!=0){ // 抽出表示の場合（調査・仮終了は省く）
        style +=
            '<style>.entry-item { display: none; } '+
            'input[name="publish_flg"][value="'+ (blogDB[0][2] -1) +'"] + '+
            'input + .entry-item { display: block; }</style>'; }


    if(!document.querySelector('#EPS')){
        document.documentElement.insertAdjacentHTML('beforeend', style); }

} // style_in()



window.addEventListener('load', function(){
    let entry_id;
    let publish_f;
    let entry_date;
    let pub_all;
    let pub_dra;
    let pub_ame;

    let ua=0;
    let agent=window.navigator.userAgent.toLowerCase();
    if(agent.indexOf('firefox') > -1){ ua=1; } // Firefoxの場合のフラグ


    let year; // 現在開いているページの年度
    let month; // 現在開いているページの月
    let year_index; // 現在のページの年度を記録する MAPのindex

    let disp_year=document.querySelector('#year');
    year=parseInt(disp_year.textContent, 10);

    let disp_month=document.querySelector('#nowMonth');
    month=parseInt(disp_month.textContent.replace(/[^0-9]/g, ''),10);


    let read_json=sessionStorage.getItem('blogDB_back'); // ストレージ 保存名
    blogDB=JSON.parse(read_json);
    if(blogDB==null){
        blogDB=[['00000000000', 's', 0]]; } // 記事ID, 投稿フラグ, 投稿年月 6桁
    // 初要素のみ　 '00000000000' ドライブモード 's'/'c'/'e' 抽出表示指定 0～3
    if(blogDB[0][1]==0){ blogDB[0][1]='s'; } // 旧ファイルやトラブル時の救済


    blogMAP={}; // 公開情報の件数データMAP
    let read_map_json=sessionStorage.getItem('blogMAP_back'); // セッションストレージ 保存名
    blogMAP=JSON.parse(read_map_json);
    if(blogMAP==null){
        blogMAP=[[['blog_map', 1000, 0],[0, 0, 0],[0, 0, 0],[0, 0, 0],[0, 0, 0],[0, 0, 0],[0, 0, 0],
                  [0, 0, 0],[0, 0, 0],[0, 0, 0],[0, 0, 0],[0, 0, 0],[0, 0, 0]]]; }

    year_index=-1;
    year_index=blogMAP.findIndex(function(elem){
        return elem[0][1]==year; }); // 現在の年度のMAPデータの有無を調べる

    if(year_index==-1){ // 現在の年度のMAPデータが無い場合は年度枠を追加
        year_index=blogMAP.length;
        blogMAP.push([['blog_map', year, 0],[0, 0, 0],[0, 0, 0],[0, 0, 0],[0, 0, 0],[0, 0, 0],[0, 0, 0],
                      [0, 0, 0],[0, 0, 0],[0, 0, 0],[0, 0, 0],[0, 0, 0],[0, 0, 0]]);

        blogMAP.sort(function(a, b){ // 年度の昇順にソート
            return b[0][1] - a[0][1]; });

        year_index=blogMAP.findIndex(function(elem){
            return elem[0][1]==year; }); // ソート後にyear_indexを再取得

        write_MAP(); } // MAP 保存



    reg_set();

    function reg_set(){
        let k;
        entry_id_DB=[]; // リセット
        pub_all=0;
        pub_dra=0;
        pub_ame=0;

        for(k=0; k<blogDB.length; k++){
            entry_id_DB[k]=blogDB[k][0]; // ID検索用の配列を作成
            if(blogDB[k][1]=='0'){
                pub_all +=1; continue; }
            if(blogDB[k][1]=='1'){
                pub_dra +=1; continue; }
            if(blogDB[k][1]=='2'){
                pub_ame +=1; continue; }}}


    if(year==1000){
        blog_start(); }// ブログの最初の記事
    else{
        control_pannel(blogDB[0][1]); // ドライブモードでパネル表示
        menu();
        now_year_disp(); // MAPを表示
    } // メニュー選択表示



    function control_pannel(d){
        let box=document.querySelector('#sorting');
        if(box){

            let help_url="https://ameblo.jp/personwritep/entry-12874974697.html";

            let help_SVG=
                '<svg height="24" width="24" viewBox="0 0 210 220">'+
                '<path d="M89 22C71 25 54 33 41 46C7 81 11 142 50 171C58 177 68 182 78 '+
                '185C90 188 103 189 115 187C126 185 137 181 146 175C155 169 163 162 169 '+
                '153C190 123 189 80 166 52C147 30 118 18 89 22z" style="fill: #000;"></path>'+
                '<path d="M67 77C73 75 78 72 84 70C94 66 114 67 109 83C106 91 98 95 93 '+
                '101C86 109 83 116 83 126L111 126C112 114 122 108 129 100C137 90 141 76 '+
                '135 64C127 45 101 45 84 48C80 49 71 50 68 54C67 56 67 59 67 61L67 77M'+
                '85 143L85 166L110 166L110 143L85 143z" style="fill:#fff;"></path>'+
                '</svg>';


            let insert_div=
                '<div id="div0"></div>'+
                '<div id="div1">'+
                '<input id="list_snap" type="submit">'+
                '<input id="reset" type="submit" value="初期化">'+
                '<input id="export" type="submit" value="MAPをファイル保存">'+
                '<input id="import_sw" type="submit" value="ファイル読込み">'+
                '<span id="import_result"></span>'+
                '<input id="import" type="file">'+
                '</div>'+
                '<div id="div2">'+
                '<span id="snap_result"></span>'+
                '<input id="amb_menu2" type="submit" value="調査を終了 ⏏">'+
                '</div>'+
                '<div id="div3">'+
                '<input id="show_map" type="submit" value="MAP全体を表示">'+
                '<input id="start_page" type="submit" value="◙ ブログの最初を表示する">'+
                '<input id="do_snap" type="submit" value="MAPの調査・ファイル処理">'+
                '<input id="amb_menu3" type="submit" value="通常表示に戻る ⏏">'+
                '<a class="help_EPM" href="'+ help_url +'">'+ help_SVG +'</a>'+
                '</div>';

            if(!box.querySelector('#div0')){
                box.insertAdjacentHTML('beforeend', insert_div); }



            let button1=box.querySelector('#list_snap');
            let button2=box.querySelector('#reset');
            let button3=box.querySelector('#export');
            let button4=box.querySelector('#import_sw');
            let span5=box.querySelector('#import_result');
            let input6=box.querySelector('#import');
            let span7=box.querySelector('#snap_result');


            if(d=='s'){
                button1.value='MAPの調査を開始　▶';
                button1.onclick=function(e){
                    e.preventDefault();
                    start(); }

                function start(){
                    let conf_str=
                        ['　　 🔴　このページ以降の記事に関して 「公開設定MAP」を調査します',
                         '\n　　　　  連続動作は [ Ctrl ] キーを押すか [ ❚❚ ] のクリックで停止します'].join(' ');
                    let ok=confirm(conf_str);
                    if(ok){
                        blogDB[0][1]='c'; // 連続動作フラグをセット
                        write_DB(); // DB 保存
                        next(); }}}


            else if(d=='c'){ //「c」は連続動作
                button2.style.display='none'; // 動作モードが「c」の場合は非表示
                button3.style.display='none'; // 動作モードが「c」の場合は非表示
                button4.style.display='none'; // 動作モードが「c」の場合は非表示
                span5.style.display='none'; // 動作モードが「c」の場合は非表示

                button1.value='MAPの調査を停止　　❚❚';
                button1.style.width='760px';

                button1.onclick=function(e){
                    e.preventDefault();
                    stop(); }

                document.addEventListener('keydown', (e)=>{
                    if(e.ctrlKey){
                        e.preventDefault();
                        stop(); }});

                function stop(){
                    blogDB[0][1]='s'; // 連続動作フラグをセット
                    write_DB(); // DB 保存
                    button1.value='MAPの調査を続行　▶';
                    button1.style.pointerEvents='none';
                    box.style.background='#96b6d2';

                    setTimeout(()=>{
                        button1.style.pointerEvents='auto';
                        button1.onclick=function(e){
                            e.preventDefault();
                            blogDB[0][1]='c'; // 連続動作フラグをセット
                            write_DB(); // DB 保存
                            location.reload(); }}, 500); }

                setTimeout(()=>{
                    if(blogDB[0][1]=='c'){
                        next(); }}, 1000); } // 連続実行のぺージ遷移のタイミング 1sec ⭕


            else if(d=='e'){ // 「e」は終了
                button1.value='🔵 MAP調査が終了しました';
                button1.onclick=function(e){ // 調査の状態に復帰
                    e.preventDefault();
                    blogDB[0][2]=4;
                    write_DB();
                    location.reload(); }}


            if(d=='s' || d=='e'){
                button2.onclick=function(e){ // 全データをリセット
                    e.preventDefault();
                    blogDB=[['00000000000', 's']];
                    write_DB(); // DB 保存
                    snap_disp();
                    button2.value='〔　〕';
                    span5.textContent='';
                    input6.value='';

                    for(let k=0; k<blogMAP.length; k++){
                        for(let m=1; m<13; m++){ // m=0 の年度表示は残す
                            blogMAP[k][m]=[0, 0, 0]; }}
                    write_MAP(); // MAP 保存
                    now_year_disp(); } // MAPを表示

                button3.onclick=function(e){
                    e.preventDefault();
                    let write_json=JSON.stringify(blogMAP);
                    let blob=new Blob([write_json], {type: 'application/json'});
                    let a_elem=document.createElement('a');
                    a_elem.href=URL.createObjectURL(blob);
                    a_elem.download='blogMAP.json'; // 保存ファイル名
                    if(ua==1){
                        a_elem.target='_blank';
                        document.body.appendChild(a_elem); }
                    a_elem.click();
                    if(ua==1){
                        document.body.removeChild(a_elem); }
                    URL.revokeObjectURL(a_elem.href); }

                button4.onclick=function(e){
                    e.preventDefault();
                    input6.click(); }

                input6.addEventListener("change", function(){
                    if(!(input6.value)) return; // ファイルが選択されない場合
                    let file_list=input6.files;
                    if(!file_list) return; // ファイルリストが選択されない場合
                    let file=file_list[0];
                    if(!file) return; // ファイルが無い場合

                    let file_reader=new FileReader();
                    file_reader.readAsText(file);
                    file_reader.onload=function(){
                        if(file_reader.result.slice(0, 14)=='[[["blog_map",'){ // blogMAP.jsonの確認
                            let data_in=JSON.parse(file_reader.result);
                            blogMAP=data_in; // 読込み上書き処理
                            write_MAP(); // MAP 保存

                            button2.value='初期化'; // 初期化後なら読み込んだ事を示す
                            snap_disp();
                            span5.textContent=file.name;
                            now_year_disp(); }// MAPを表示
                        else{
                            alert(
                                "   ⛔ 不適合なファイルです  \n"+
                                "blogMAP(n).json ファイルを選択してください"); }}
                }); }

            snap_disp();

        } // if(box)

    } // control_pannel()



    function snap_disp(){
        reg_set();
        let span7=document.querySelector('#snap_result');
        span7.innerHTML=
            '　記録件数：<b>' + (blogDB.length -1) +
            '</b>　　全員に公開：<b>' + pub_all +
            '</b>　　アメンバー限定公開：<b>' + pub_ame +
            '</b>　　下書き：<b>' + pub_dra; +'</b>'; }



    function next(){
        let win_url;
        let current;
        let pageid;
        let next_url;
        let pager;
        let end;

        entry_id=document.querySelectorAll('input[name="entry_id"]');
        if(entry_id.length >0){
            snap(); } // 投稿記事がある場合SNAPを実行 無ければスルーする

        win_url=window.location.search.substring(1,window.location.search.length);
        current=win_url.slice(-6);
        if(!current){ current=make_curr(); }

        if(win_url.indexOf('pageID') ==-1){ // pageIDが無い 月のトップページの場合
            pager=document.querySelector('.pagingArea');
            if(pager){ // ページャーが有りその末尾でなければ同月次ページへ
                next_url=['https://blog.ameba.jp/ucs/entry/srventrylist.do?',
                          'pageID=2&entry_ym=' + current].join('');
                window.open( next_url, '_self'); }
            else{ // ページャーが無ければ次月トップページへ
                current=make_next(current);
                if(current!=0){ // 現在を越えないなら次月へ
                    next_url=['https://blog.ameba.jp/ucs/entry/srventrylist.do?',
                              'entry_ym=' + current].join('');
                    window.open( next_url, '_self'); }
                else{ // 現在を越えたら0が戻り停止
                    when_edge(); }}}

        else{ // pageIDを含み 月のトップページでない場合
            end=document.querySelector('.pagingArea .disabled.next');
            if(!end){ // ページャーの末尾でなければ同月次ページへ
                pageid=parseInt(win_url.slice(7).slice(0, -16), 10) +1;
                next_url=['https://blog.ameba.jp/ucs/entry/srventrylist.do?',
                          'pageID=' + pageid + '&entry_ym=' + current].join('');
                window.open( next_url, '_self'); }
            else{ // ページャーの末尾なら次月トップページへ
                current=make_next(current);
                if(current!=0){ // 現在を越えないなら次月へ
                    next_url=['https://blog.ameba.jp/ucs/entry/srventrylist.do?',
                              'entry_ym=' + current].join('');
                    window.open( next_url, '_self'); }
                else{ // 現在を越えたら0が戻り停止
                    when_edge(); }}}


        function make_next(curr){
            let ym;
            let y;
            let m;
            ym=parseInt(curr, 10); // 10進数値化
            y=Math.floor(ym/100); // 年は100で割った商
            m=ym % 100; // 月は100で割った余り
            if(m !=12){
                ym=100*y + m +1; }
            else{
                ym=100*y + 101; }

            let now=new Date();
            if(ym > 100*now.getFullYear() + now.getMonth() +1){
                return 0; } // 現在の月を越える場合は0を返す
            else{
                return ym; }} // 次年月の数値を返す


        function make_curr(){
            let now=new Date();
            return 100*now.getFullYear() + now.getMonth() +1 }


        function when_edge(){
            blogDB[0][1]='s'; // 連続動作フラグをリセット
            write_DB(); // DB 保存
            control_pannel('e'); } // SNAP終了時の表示をさせる

    } // next()



    function snap(){ // ページ内の「公開設定」をSNAPする
        let win_url=window.location.search.substring(1,window.location.search.length);
        let entry_date=parseInt(win_url.slice(-6), 10); // SNAPしている現在の「年月 6桁」
        if(!entry_date){ entry_date=make_curr(); }
        function make_curr(){
            let now=new Date();
            return 100*now.getFullYear() + now.getMonth() +1 }

        entry_id=document.querySelectorAll('input[name="entry_id"]');
        publish_f=document.querySelectorAll('input[name="publish_flg"]');

        for(let k=0; k< entry_id.length; k++){
            let index=entry_id_DB.indexOf(entry_id[k].value);
            if(index==-1){ // IDがblogDBに記録されていない場合
                blogDB.push([entry_id[k].value, publish_f[k].value, entry_date]); } // 登録を追加
            else{ // IDがblogDBに記録されていた場合
                blogDB[index]=[entry_id[k].value, publish_f[k].value, entry_date]; }} // 登録を更新


        let filter_date=blogDB.filter(function(value){
            return value[2]==entry_date; });

        if(filter_date.length>0){
            let pub_all=filter_date.filter(function(value){
                return value[1]==0; });
            blogMAP[year_index][month][0]=pub_all.length;

            let pub_dra=filter_date.filter(function(value){
                return value[1]==1; });
            blogMAP[year_index][month][1]=pub_dra.length;

            let pub_ame=filter_date.filter(function(value){
                return value[1]==2; });
            blogMAP[year_index][month][2]=pub_ame.length; }

        setTimeout(write_DB, 10);
        setTimeout(write_MAP, 10);

    } // snap()



    function now_year_disp(){
        let box=document.querySelector('#sorting');
        if(box){
            let now_year_snap=
                '<div class="div_add">'+
                arr_disp(year_index) +
                '</div>';

            let div0=box.querySelector('#div0');
            if(div0){
                div0.innerHTML=now_year_snap; }
            p_color();
            easy_go();
            map_select();
            about_comment(0); }}



    function map_select(){
        let div0=document.querySelector('#div0');
        if(div0){
            let sw=document.querySelector('#show_map');
            div0.onclick=function(e){
                e.preventDefault();
                let div_add=div0.querySelectorAll('.div_add');
                if(div_add.length>1){
                    now_year_disp();
                    sw.value='MAP全体を表示'; }
                else{
                    all_year_disp();
                    sw.value='MAPを限定表示'; }}}}



    function all_year_disp(){
        let box=document.querySelector('#sorting');
        if(box){
            let all_year_snap='';
            for(let k=0; k<blogMAP.length-1; k++){
                all_year_snap+=
                    '<div class="div_add">'+
                    arr_disp(k) +
                    '</div>'; }

            let div0=box.querySelector('#div0');
            if(div0){
                div0.innerHTML=all_year_snap; }
            p_color();
            easy_go();
            map_select();
            about_comment(1); }}



    function about_comment(n){
        let map_now;
        let map_year=document.querySelectorAll('.div_add');
        if(n==0){
            map_now=map_year[0]; }
        else{
            map_now=map_year[year_index]; }


        if(blogDB[0][2]==0 || blogDB[0][2]==4){
            let add_m=map_now.querySelectorAll('.m');
            add_m[month].style.outline='2px solid #2196f3'; }


        if(blogDB[0][2]>0 && blogDB[0][2]<4){
            let add_mp=map_now.querySelectorAll('.m p');
            let index=month*4 + blogDB[0][2];
            add_mp[index].style.outline='2px solid red';
            add_mp[index].style.position='relative'; }



        if(blogDB[0][2]>-1 && blogDB[0][2]<4){ // 以下はMAPの検証コード
            let publish_f=document.querySelectorAll('input[name="publish_flg"]');
            pub_all=0;
            pub_dra=0;
            pub_ame=0;

            for(let k=0; k<publish_f.length; k++){
                if(publish_f[k].value==0){
                    pub_all+=1; }
                if(publish_f[k].value==1){
                    pub_dra+=1; }
                if(publish_f[k].value==2){
                    pub_ame+=1; }}

            let alert1=0; // MAP値と記事リスト数の不一致
            let pagingArea=document.querySelector('form > .pagingArea');
            if(!pagingArea){
                if(pub_all!=blogMAP[year_index][month][0] ||
                   pub_dra!=blogMAP[year_index][month][1] ||
                   pub_ame!=blogMAP[year_index][month][2]){
                    alert1=1; }}
            else{
                if(pub_all>blogMAP[year_index][month][0] ||
                   pub_dra>blogMAP[year_index][month][1] ||
                   pub_ame>blogMAP[year_index][month][2]){
                    alert1=1; }
                if(blogDB[0][2]==0){
                    if((blogMAP[year_index][month][0]+blogMAP[year_index][month][1]+
                        blogMAP[year_index][month][2])<20){
                        alert1=1; }}}

            if(alert1==1){
                let box=document.querySelector('#sorting');
                if(box){
                    let com1='<p id="com1">MAPと記事リストが一致しません：MAPの調査・更新　'+
                        'またはファイルからMAPデータの読込みが必要です</p>';
                    if(!box.querySelector('#com1')){
                        box.insertAdjacentHTML('afterbegin', com1); }}}


            if(blogDB[0][2]==1){
                if(pub_all<blogMAP[year_index][month][0]){
                    other_alert(pub_all, blogMAP[year_index][month][0]); }}
            if(blogDB[0][2]==2){
                if(pub_dra<blogMAP[year_index][month][1]){
                    other_alert(pub_dra, blogMAP[year_index][month][1]); }}
            if(blogDB[0][2]==3){
                if(pub_ame<blogMAP[year_index][month][2]){
                    other_alert(pub_ame, blogMAP[year_index][month][2]); }}

            function other_alert(count, map){
                let pagingArea=document.querySelector('form > .pagingArea');
                if(pagingArea){
                    let com2='<p id="com2">抽出記事の分散：<b>'+ count + '</b>　別ページ：<b>'+
                        (map - count) +'</b></p>';
                    if(!pagingArea.querySelector('#com2')){
                        pagingArea.insertAdjacentHTML('beforeend', com2); }}}

        } // if(blogDB[0][2]>-1 && blogDB[0][2]<4)
    } // about_comment()



    function arr_disp(y){
        let arr=
            '<div class="m y_index"><p>'+blogMAP[y][0][1]+'<span class="yt">年</span></p>'+
            '<p class="ypt">全員に公開</p><p class="ypt">　　'+
            '下書き</p><p class="ypt">アメンバー</p></div>'+
            '<div class="m"><p class="mt">1月</p><p>'+blogMAP[y][1][0]+'</p><p>'+
            blogMAP[y][1][1]+'</p><p>'+blogMAP[y][1][2]+'</p></div>'+
            '<div class="m"><p class="mt">2月</p><p>'+blogMAP[y][2][0]+'</p><p>'+
            blogMAP[y][2][1]+'</p><p>'+blogMAP[y][2][2]+'</p></div>'+
            '<div class="m"><p class="mt">3月</p><p>'+blogMAP[y][3][0]+'</p><p>'+
            blogMAP[y][3][1]+'</p><p>'+blogMAP[y][3][2]+'</p></div>'+
            '<div class="m"><p class="mt">4月</p><p>'+blogMAP[y][4][0]+'</p><p>'+
            blogMAP[y][4][1]+'</p><p>'+blogMAP[y][4][2]+'</p></div>'+
            '<div class="m"><p class="mt">5月</p><p>'+blogMAP[y][5][0]+'</p><p>'+
            blogMAP[y][5][1]+'</p><p>'+blogMAP[y][5][2]+'</p></div>'+
            '<div class="m"><p class="mt">6月</p><p>'+blogMAP[y][6][0]+'</p><p>'+
            blogMAP[y][6][1]+'</p><p>'+blogMAP[y][6][2]+'</p></div>'+
            '<div class="m"><p class="mt">7月</p><p>'+blogMAP[y][7][0]+'</p><p>'+
            blogMAP[y][7][1]+'</p><p>'+blogMAP[y][7][2]+'</p></div>'+
            '<div class="m"><p class="mt">8月</p><p>'+blogMAP[y][8][0]+'</p><p>'+
            blogMAP[y][8][1]+'</p><p>'+blogMAP[y][8][2]+'</p></div>'+
            '<div class="m"><p class="mt">9月</p><p>'+blogMAP[y][9][0]+'</p><p>'+
            blogMAP[y][9][1]+'</p><p>'+blogMAP[y][9][2]+'</p></div>'+
            '<div class="m"><p class="mt">10月</p><p>'+blogMAP[y][10][0]+'</p><p>'+
            blogMAP[y][10][1]+'</p><p>'+blogMAP[y][10][2]+'</p></div>'+
            '<div class="m"><p class="mt">11月</p><p>'+blogMAP[y][11][0]+'</p><p>'+
            blogMAP[y][11][1]+'</p><p>'+blogMAP[y][11][2]+'</p></div>'+
            '<div class="m"><p class="mt">12月</p><p>'+blogMAP[y][12][0]+'</p><p>'+
            blogMAP[y][12][1]+'</p><p>'+blogMAP[y][12][2]+'</p></div>';
        return arr;
    } // arr_disp(y)



    function p_color(){
        let box=document.querySelector('#sorting');
        if(box){
            let pub_all=box.querySelectorAll('.div_add .m p:nth-child(2)');
            for(let k=0; k<pub_all.length; k++){
                if(pub_all[k].textContent=='0'){
                    pub_all[k].style.color='transparent'; }}

            let pub_dra=box.querySelectorAll('.div_add .m p:nth-child(3)');
            for(let k=0; k<pub_dra.length; k++){
                if(pub_dra[k].textContent=='0'){
                    pub_dra[k].style.color='transparent'; }
                else{
                    pub_dra[k].style.background='#d7ecfd'; }}

            let pub_ame=box.querySelectorAll('.div_add .m p:nth-child(4)');
            for(let k=0; k<pub_ame.length; k++){
                if(pub_ame[k].textContent=='0'){
                    pub_ame[k].style.color='transparent'; }
                else{
                    pub_ame[k].style.background='#a3d8d4'; }}

        }} // p_color()



    function easy_go(){
        let add_mp=document.querySelectorAll('.div_add .m p');

        for(let k=0; k<add_mp.length; k++){
            add_mp[k].addEventListener('mouseenter', function(){
                if(!add_mp[k].classList.contains('mt')){
                    add_mp[k].closest('.m').style.outlineColor='transparent'; }});
            add_mp[k].addEventListener('mouseleave', function(){
                if(!add_mp[k].classList.contains('mt')){
                    add_mp[k].closest('.m').style.outlineColor='#2196f3'; }}); }

        for(let k=0; k<add_mp.length; k++){
            add_mp[k].addEventListener('click', function(e){
                if(!add_mp[k].closest('.m').classList.contains('y_index')){
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    jump_year(add_mp[k]); }
            }); }


        function jump_year(m_mp){
            let div_add=m_mp.closest('.div_add');
            let to_year=div_add.querySelector('.y_index p').textContent;
            to_year=to_year.replace(/[^0-9]/g, '');

            let div_m=m_mp.closest('.m');
            let to_month=div_m.querySelector('.mt').textContent;
            to_month=to_month.replace(/[^0-9]/g, '');
            if(to_month!='10' && to_month!='11' && to_month!='12'){
                to_month='0'+ to_month; }

            let month_p=div_m.querySelectorAll('p');
            if(m_mp==month_p[0]){
                blogDB[0][2]=0; } // MAPの「月枠」を選択
            else if(m_mp==month_p[1]){
                blogDB[0][2]=1; } // MAPの「全体に公開」を選択
            else if(m_mp==month_p[2]){
                blogDB[0][2]=2; } // MAPの「下書き」を選択
            else if(m_mp==month_p[3]){
                blogDB[0][2]=3; } // MAPの「アメンバー」を選択

            write_DB(); // DB 保存

            let to_url=
                'https://blog.ameba.jp/ucs/entry/srventrylist.do?entry_ym='+ to_year + to_month;
            location.href=to_url; } // 選択した「年度・月」のページを開く

    } // easy_go()



    function menu(){
        let amb_menu2=document.querySelector('#amb_menu2');
        let amb_menu3=document.querySelector('#amb_menu3');

        if(blogDB[0][2]!=4){
            let show_map=document.querySelector('#show_map');
            show_map.onclick=function(e){
                e.preventDefault();
                let div0=document.querySelector('#div0');
                if(div0){
                    div0.click(); }}

            let start_page=document.querySelector('#start_page');
            start_page.onclick=function(e){
                e.preventDefault();
                blogDB[0][2]=0;
                write_DB();
                location.href=
                    'https://blog.ameba.jp/ucs/entry/srventrylist.do?entry_ym=100001'; }

            let do_snap=document.querySelector('#do_snap');
            do_snap.onclick=function(e){
                e.preventDefault();
                blogDB[0][2]=4;
                write_DB();
                location.reload(); }

            amb_menu3.onclick=function(e){
                e.preventDefault();
                if(blogDB[0][2]!=4){
                    blogDB[0][2]=5;
                    write_DB();
                    location.reload(); }}}

        else if(blogDB[0][2]==4){ // 4は Snap実行モード
            amb_menu2.onclick=function(e){
                e.preventDefault();
                blogDB[0][2]=0;
                write_DB();
                location.reload(); }}

    } // menu()



    function blog_start(){
        let return_sw=document.querySelector('#entryYear a');
        if(return_sw){
            return_sw.click(); }}

});



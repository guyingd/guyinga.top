/**
 * 自动生成博客、文档或视频教程文本工具
 */

import figlet from "figlet";
import chalk from "chalk";
import inquirer from "inquirer";
import ora from "ora";
import fs from "fs";
import path from "path";
import shell from "shelljs";
import fetch from "isomorphic-fetch";

const docTypeHandlers = {
  "video doc": askVideoDocInfo,
  doc: () => {},
  blog: () => {},
};

const videoDocCategoryToSidebar = {
  css: "CSS",
  js: "JavaScript",
  html: "HTML",
  effects: "特效",
  browser: "浏览器",
  web: "Web",
  network: "网络",
  react: "React",
  vue: "Vue",
  ts: "TypeScript",
};

(async () => {
  console.log(
    chalk.blue("======================================================")
  );
  console.log(chalk.blue(figlet.textSync("Feng Hua Front Dev")));
  console.log(
    chalk.blue("======================================================")
  );

  const docType = await askDocType();
  await docTypeHandlers[docType]();
  console.log(
    chalk.yellow("======================================================")
  );
  console.log(chalk.green("创建视频关联文档成功！"));
})();

async function askDocType() {
  const questions = [
    {
      type: "list",
      name: "docType",
      message: "请选择要创建的文章类型：",
      choices: ["video doc", "doc", "blog"],
    },
  ];
  const { docType } = await inquirer.prompt(questions);
  return docType;
}

async function askVideoDocInfo() {
  const videos = await getVideos();

  const questions = [
    {
      type: "list",
      name: "bvid",
      message: "请选择关联视频",
      choices: videos,
    },
    {
      type: "list",
      name: "docCategory",
      message: "请选择类别：",
      choices: Object.keys(videoDocCategoryToSidebar),
    },
    {
      type: "input",
      name: "docName",
      message: "请输入文件名：",
    },
  ];

  const { bvid, docCategory, docName } = await inquirer.prompt(questions);

  const { aid, cid } = await getIframeUrl(bvid);

  // extract url part from iframecode
  // const urlPattern = /\/\/player.*page=1/g;
  // const url = iframe.match(urlPattern);

  // construct iframe url
  const url = `//player.bilibili.com/player.html?aid=${aid}&bvid=${bvid}&cid=${cid}&page=1`;

  const dirName = `docs/videos/${docCategory}`;
  // get number
  let count = getFileCount(dirName) + 1;
  count = count > 10 ? count : `0${count}`;

  // console.log(
  //   `hygen video-doc new ${docName} --category ${docCategory} --num ${count} --sidebar ${videoDocCategoryToSidebar[docCategory]} --url "${url}"`
  // );
  shell.exec(
    `hygen video-doc new ${docName} --category ${docCategory} --num ${count} --sidebar ${videoDocCategoryToSidebar[docCategory]} --url "${url}"`
  );
}

// hygen video-doc new css-test --category css --num 09 --sidebar CSS
// --url "//player.bilibili.com/player.html?aid=459257162&bvid=BV1i5411E7hk&cid=299756621&page=1"

/**
 * @param dir {string}
 * @return {number}
 */
function getFileCount(dir) {
  // "docs/videos/css"
  const files = fs.readdirSync(dir);
  const filesArr = files.filter((file) => !file.startsWith("."));
  return filesArr.length;
}

async function getVideos() {
  const spinner = ora(chalk.blue("加载视频列表...")).start();

  // 获取视频列表 API
  const res = await fetch(
    `https://api.bilibili.com/x/space/arc/search?mid=302954484&ps=100&tid=0&pn=1&keyword=&order=pubdate&jsonp=jsonp`
  );
  const resData = await res.json();
  const {
    data: {
      list: { vlist },
    },
  } = resData;
  spinner.succeed(chalk.green("加载视频列表成功"));
  return vlist.map((video, index) => ({
    name: `${index + 1}. ${video.title}`,
    value: video.bvid,
    short: video.title.slice(0, 18) + "...",
  }));
  // https://api.bilibili.com/x/space/arc/search?mid=302954484&ps=30&tid=0&pn=1&keyword=&order=pubdate&jsonp=jsonp
}

async function getIframeUrl(bvid) {
  const spinner = ora(chalk.blue("组装 iframe url...")).start();

  // 获取视频详情 API
  const res = await fetch(
    `http://api.bilibili.com/x/web-interface/view?bvid=${bvid}`
  );
  const resData = await res.json();
  const {
    data: { aid, cid },
  } = resData;
  spinner.succeed(chalk.green("组装 iframe url 成功"));
  return { aid, bvid, cid };
}
import { parseHTML } from "linkedom";
import { Feed } from "feed";
import * as fs from "fs";

type Shoe = {
  id: string;
  name: string;
  link: string;
  price: number;
  originalPrice: number;
};

async function getShoes(size: number): Promise<string> {
  const api = `https://www.rivers.com.au/rivers-footwear-mens-footwear?prefn1=size&prefv1=${size}&srule=sorting-CategoryPosition-Rivers-First&start=0&sz=1000`;
  const response = await fetch(api);

  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.status}`);
  }

  return await response.text();
}

function parsePage(html: string): Shoe[] {
  const shoes: Shoe[] = [];
  const { document } = parseHTML(html);

  const rows = document.querySelectorAll<HTMLElement>(".product");
  for (const row of Array.from(rows)) {
    shoes.push({
      id: row.getAttribute("data-pid")!,
      name: row.querySelector<HTMLElement>(".pdp-link")!.innerText,
      link:
        "https://www.rivers.com.au" +
        row.querySelector<HTMLElement>(".data-gtm")?.getAttribute("href"),
      price: Number(
        row.querySelector(".sales > .value")?.getAttribute("content")
      ),
      originalPrice: Number(
        row.querySelector(".strike-through > .value")?.getAttribute("content")
      ),
    });
  }
  return shoes;
}

function createFeed(pageJson) {
  const feed = new Feed({
    title: "Rivers API",
    description: "Rivers promotions",
    link: "https://www.rivers.com.au",
    updated: new Date(),
    id: "",
    copyright: "",
  });

  pageJson.forEach((shoe) => {
    feed.addItem({
      title: shoe.name,
      link: shoe.link,
      description: `New deal Price:${shoe.price} Original:${shoe.originalPrice}`,
      date: new Date(),
    });
  });

  return feed;
}

function writeJsonToFile(inShoes: Shoe[], outFile) {
  fs.writeFile(outFile, JSON.stringify(inShoes), (err) => {
    console.log("File written");
  });
}

function writeFeedToFile(feed: string) {
  fs.writeFile("rss.xml", feed, (err) => {
    console.log("Feed written");
  });
}

function compareToPrevious(previous: Shoe[], current: Shoe[]) {
  return current.filter((currentShoe: Shoe) => {
    return !previous.some((previousShoe: Shoe) => {
      return currentShoe.id === previousShoe.id;
    });
  });
}

function filterToDiscounts(shoes: Shoe[]) {
  return shoes.filter((shoe: Shoe) => {
    return shoe.price < shoe.originalPrice;
  });
}

function appendToJSON(shoes: Shoe[], changes: Shoe[]): Shoe[] {
  return [...shoes, ...changes];
}

async function buildRss() {
  const html: string = await getShoes(11);
  const pageJson: Shoe[] = parsePage(html);
  const discountedShoes = filterToDiscounts(pageJson);
  const previousFile = fs.readFileSync("data/previous.json", "utf8");
  const changedObjects = compareToPrevious(
    JSON.parse(previousFile),
    discountedShoes
  );

  if (changedObjects.length > 0) {
    const forFeed = fs.readFileSync("data/forFeed.json", "utf8");
    const feedJSON = appendToJSON(JSON.parse(forFeed), changedObjects);
    writeJsonToFile(discountedShoes, "data/previous.json");
    writeJsonToFile(feedJSON, "data/forFeed.json");
    console.log("changed", changedObjects);
    // console.log("feed", feedJSON)

    const feed = createFeed(feedJSON);
    writeFeedToFile(feed.rss2());
  } else {
    console.log("Nothing new");
  }

  // console.log(feed.rss2())
}

buildRss();

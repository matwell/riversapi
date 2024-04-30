// import { parseHTML } from "linkedom";
import * as cheerio from "cheerio";
import { Feed } from "feed";
import * as fs from "node:fs";

type Shoe = {
	id: string;
	name: string;
	link: string;
	price: number;
	originalPrice: number;
	date: Date;
	image: string;
};

async function getShoesHTML(size: number): Promise<string> {
	const api = `https://www.rivers.com.au/rivers-footwear-mens-footwear?prefn1=size&prefv1=${size}&srule=sorting-CategoryPosition-Rivers-First&start=0&sz=1000`;
	const response = await fetch(api);

	if (!response.ok) {
		throw new Error(`Failed to fetch: ${response.status}`);
	}

	const html = await response.text();

	return html;
}

function parsePage(html: string): Shoe[] {
	const shoes: Shoe[] = [];
	const $ = cheerio.load(html);
	const rows = $(".product");
	//Only continue if some rows are found
	if (rows.length === 0) {
		throw new Error("No rows containing .product found");
	}
	rows.each((_, row) => {
		const id: string | undefined = $(row).attr("data-pid");
		if (id) {
			const name: string = $(row)
				.find(".pdp-link")
				.text()
				.replace(/[^a-zA-Z0-9 ]/g, "");
			const link: string = `https://www.rivers.com.au/${$(row)
				.find(".data-gtm")
				.attr("href")}`;
			const price: number = Number(
				$(row).find(".sales > .value").attr("content"),
			);
			const originalPrice: number = Number(
				$(row).find(".strike-through > .value").attr("content"),
			);
			const image: string =
				$(row)
					.find(".tile-image")
					.attr("srcset")
					?.split(",")[0]
					.split("?")[0] || "";
			shoes.push({
				id: id,
				name: name,
				link: link,
				price: price,
				originalPrice: originalPrice,
				date: new Date(),
				image: image,
			});
		}
	});
	return shoes;
}

function createFeed(pageJson: Shoe[]) {
	const feed = new Feed({
		title: "Rivers API",
		description: "Rivers promotions",
		link: "https://www.rivers.com.au",
		updated: new Date(),
		id: "",
		copyright: "",
	});

	for (const shoe of pageJson) {
		feed.addItem({
			title: shoe.name,
			link: shoe.link,
			description: `New deal Price:${shoe.price} Original:${shoe.originalPrice}`,
			date: new Date(shoe.date),
			image: shoe.image,
		});
	}

	return feed;
}

function writeJsonToFile(inShoes: Shoe[], outFile: fs.PathOrFileDescriptor) {
	fs.writeFile(outFile, JSON.stringify(inShoes), () => {
		console.log(outFile, "File written");
	});
}

function writeFeedToFile(feed: string) {
	fs.writeFile("rss.xml", feed, () => {
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
	const html: string = await getShoesHTML(10);
	const pageJson: Shoe[] = parsePage(html);
	console.log(pageJson);
	const discountedShoes = filterToDiscounts(pageJson);
	console.log(discountedShoes);
	const previousFile = fs.readFileSync("data/previous.json", "utf8");
	const changedObjects = compareToPrevious(
		JSON.parse(previousFile),
		discountedShoes,
	);

	if (changedObjects.length > 0) {
		const forFeed = fs.readFileSync("data/forFeed.json", "utf8") || "[{}]";
		const feedJSON = appendToJSON(JSON.parse(forFeed), changedObjects);
		writeJsonToFile(discountedShoes, "data/previous.json");
		writeJsonToFile(feedJSON, "data/forFeed.json");
		console.log("changed", changedObjects);

		const feed = createFeed(feedJSON);
		writeFeedToFile(feed.rss2());
	} else {
		console.log("Nothing new");
	}
}

buildRss();

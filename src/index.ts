import { parseHTML } from 'linkedom';
import { Feed } from 'feed';
import fs  from "fs"

type Shoe = {
	id: string;
	name: string;
	price: number;
	originalPrice: number;
}

async function getShoes(size:number) : Promise<string>{
	const api = `https://www.rivers.com.au/rivers-footwear-mens-footwear?prefn1=size&prefv1=${size}&srule=sorting-CategoryPosition-Rivers-First&start=0&sz=60`;
	const response = await fetch(api);

	if (!response.ok) {
		throw new Error(`Failed to fetch: ${response.status}`);
	}

	return await response.text();
}

function parsePage(html:string) : Shoe[] {
	const shoes : Shoe[] = [];
	const { document } = parseHTML(html);

	const rows = document.querySelectorAll<HTMLElement>('.product');
	for (const row of rows) {
		shoes.push({
			id: row.getAttribute("data-pid"),
			name: row.querySelector<HTMLElement>('.pdp-link').innerText,
			price: Number(row.querySelector('.sales > .value')?.getAttribute("content")),
			originalPrice: Number(row.querySelector(".strike-through > .value")?.getAttribute("content"))
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
		copyright: ""
    })

    pageJson.forEach(shoe => {
        feed.addItem({
            title: shoe.name,
            link: "",
            description: `New deal Price:${shoe.price} Original:${shoe.originalPrice}`,
			date: new Date()
        })
    });

    return feed
}

function writeJsonToFile(inShoes:Shoe[], outFile) {
	fs.writeFile(outFile, JSON.stringify(inShoes), (err) => {
		console.log("File written")
	})
}


function compareToPrevious(previous: Shoe[], current:Shoe[]) {
	return current.filter((currentShoe: Shoe) => {
        return !previous.some((previousShoe: Shoe) => {
            return currentShoe.id === previousShoe.id;
        });
    });
}

function filterToDiscounts(shoes:Shoe[]) {
	return shoes.filter((shoe: Shoe) => {
		return shoe.price < shoe.originalPrice
	})
}

async function buildRss() {
	const html : string = await getShoes(11);
	const pageJson:Shoe[] = parsePage(html);
	const discountedShoes = filterToDiscounts(pageJson)
	const previousFile = fs.readFileSync("data/previous.json", 'utf8')
	const changedObjects = compareToPrevious(JSON.parse(previousFile),discountedShoes)
	console.log(changedObjects)
	// writeJsonToFile(discountedShoes, "data/previous.json")

    const feed = createFeed(changedObjects);

    // console.log(feed.rss2())
}

buildRss()
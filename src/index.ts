import { parseHTML } from 'linkedom';
import { Feed } from 'feed';

async function getShoes(size:number) {
	const api = `https://www.rivers.com.au/rivers-footwear-mens-footwear?prefn1=size&prefv1=${size}&srule=sorting-CategoryPosition-Rivers-First&start=0&sz=60`;
	const response = await fetch(api);

	if (!response.ok) {
		throw new Error(`Failed to fetch: ${response.status}`);
	}

	return await response.text();
}

function parsePage(html:string){
	const shoes = [];
	const { document } = parseHTML(html);

	const rows = document.querySelectorAll<HTMLElement>('.product');
	for (const row of rows) {
		shoes.push({
			id: row.getAttribute("data-pid"),
			name: row.querySelector<HTMLElement>('.pdp-link').innerText,
			price: row.querySelector('.sales > .value')?.getAttribute("content"),
			originalPrice: row.querySelector(".strike-through > .value")?.getAttribute("content")
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

async function buildRss() {
	const html = await getShoes(11);
	const pageJson = parsePage(html);
    const feed = createFeed(pageJson);
    console.log(feed.rss2())
}

buildRss()
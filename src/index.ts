import * as cheerio from 'cheerio';
import {Feed} from 'feed';
import {eq} from 'drizzle-orm';
import {db} from './db/db.js';
import * as schema from './db/schema.js';

type Shoe = {
  id: string;
  name: string;
  link: string;
  price: number;
  originalPrice: number;
  date: Date;
  image: string;
};

async function getShoes(size: number): Promise<string> {
  const api = `https://www.rivers.com.au/rivers-footwear-mens-footwear?prefn1=size&prefv1=${size}&srule=sorting-CategoryPosition-Rivers-First&start=0&sz=1000`;
  const response = await fetch(api);

  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.status}`);
  }

  return response.text();
}

function parsePage(html: string): Shoe[] {
  const shoes: Shoe[] = [];
  const $ = cheerio.load(html);
  const rows = $('.product');
  rows.each((_, row) => {
    const id: string = $(row).attr('data-pid')!;
    const name: string = $(row)
      .find('.pdp-link')
      .text()
      .replace(/[^a-zA-Z\d ]/g, '');
    const link: string =
      'https://www.rivers.com.au' + $(row).find('.data-gtm').attr('href');
    const price = Number($(row).find('.sales > .value').attr('content'));
    const originalPrice = Number(
      $(row).find('.strike-through > .value').attr('content')
    );
    const image: string =
      $(row).find('.tile-image').attr('srcset')?.split(',')[0].split('?')[0] ??
      '';
    shoes.push({
      id,
      name,
      link,
      price,
      originalPrice,
      date: new Date(),
      image,
    });
  });
  return shoes;
}

function createFeed(pageJson: Shoe[]) {
  const feed = new Feed({
    title: 'Rivers API',
    description: 'Rivers promotions',
    link: 'https://www.rivers.com.au',
    updated: new Date(),
    id: '',
    copyright: '',
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

function filterToDiscounts(shoes: Shoe[]) {
  return shoes.filter((shoe: Shoe) => {
    return shoe.price < shoe.originalPrice;
  });
}

async function writeShoesToDb(inputShoes: Shoe[]) {
  const promises = inputShoes.map(async (shoe) => {
    const result = await db
      .select()
      .from(schema.shoes)
      .where(eq(schema.shoes.id, shoe.id));
    if (result.length === 0) {
      await db.insert(schema.shoes).values(shoe);
    } else if (shoe.price !== result[0].price) {
      await db
        .update(schema.shoes)
        .set({...shoe, addToFeed: true})
        .where(eq(schema.shoes.id, shoe.id));
    }
  });

  await Promise.all(promises);
}

// Function to console.log all entries of shoes database
async function logAll() {
  const result = await db.select().from(schema.shoes);
  console.log(result);
  console.log('End');
}

async function main() {
  const html: string = await getShoes(11);
  const pageJson: Shoe[] = parsePage(html);
  const discountedShoes = filterToDiscounts(pageJson);
  await writeShoesToDb(discountedShoes);
  await logAll();
}

void main();

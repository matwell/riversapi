CREATE TABLE `shoes` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`link` text NOT NULL,
	`price` integer NOT NULL,
	`originalPrice` integer NOT NULL,
	`date` text DEFAULT CURRENT_TIMESTAMP,
	`image` text NOT NULL,
	`addToFeed` integer DEFAULT true
);

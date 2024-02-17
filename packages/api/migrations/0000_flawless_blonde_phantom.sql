CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`first_name` text,
	`last_name` text,
	`email` text,
	`password` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);

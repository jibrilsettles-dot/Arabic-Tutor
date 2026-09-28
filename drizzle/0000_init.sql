CREATE TABLE `messages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`role` text NOT NULL,
	`kind` text DEFAULT 'chat' NOT NULL,
	`content` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `profiles` (
	`user_id` text PRIMARY KEY NOT NULL,
	`onboarded` integer DEFAULT false NOT NULL,
	`address_as` text DEFAULT 'm' NOT NULL,
	`madinah_start` text DEFAULT 'none' NOT NULL,
	`aby_start` text DEFAULT 'none' NOT NULL,
	`goals` text DEFAULT '' NOT NULL,
	`summary` text DEFAULT '' NOT NULL,
	`strengths` text DEFAULT '[]' NOT NULL,
	`struggles` text DEFAULT '[]' NOT NULL,
	`current_topic_id` text,
	`timezone` text DEFAULT 'UTC' NOT NULL,
	`notify_enabled` integer DEFAULT false NOT NULL,
	`notify_hour` integer DEFAULT 18 NOT NULL,
	`last_proactive_at` integer,
	`proactive_count` integer DEFAULT 0 NOT NULL,
	`last_memory_message_id` integer DEFAULT 0 NOT NULL,
	`updated_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `push_subscriptions` (
	`endpoint` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`p256dh` text NOT NULL,
	`auth` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `skills` (
	`user_id` text NOT NULL,
	`topic_id` text NOT NULL,
	`status` text NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`updated_at` integer NOT NULL,
	PRIMARY KEY(`user_id`, `topic_id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`password_hash` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE TABLE `vocab` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`word` text NOT NULL,
	`root` text DEFAULT '' NOT NULL,
	`meaning` text DEFAULT '' NOT NULL,
	`misses` integer DEFAULT 0 NOT NULL,
	`hits` integer DEFAULT 0 NOT NULL,
	`last_seen_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `vocab_user_word` ON `vocab` (`user_id`,`word`);
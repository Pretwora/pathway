CREATE TABLE `entries` (
	`id` text PRIMARY KEY NOT NULL,
	`goal_id` text NOT NULL,
	`day` text NOT NULL,
	`amount` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`goal_id`) REFERENCES `goals`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `one_entry_per_day` ON `entries` (`goal_id`,`day`);--> statement-breakpoint
CREATE TABLE `goals` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`target` integer NOT NULL,
	`unit` text NOT NULL,
	`quick_steps` text NOT NULL,
	`deadline_at` integer,
	`status` text NOT NULL,
	`created_at` integer NOT NULL,
	`completed_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `one_active_goal` ON `goals` (`status`) WHERE "goals"."status" = 'active';
CREATE TABLE `partner_activation_tokens` (
	`id` text PRIMARY KEY NOT NULL,
	`partner_id` text NOT NULL,
	`token_hash` text NOT NULL,
	`token_last4` text NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`partner_id`) REFERENCES `partner_profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `partner_activation_partner_unique` ON `partner_activation_tokens` (`partner_id`);
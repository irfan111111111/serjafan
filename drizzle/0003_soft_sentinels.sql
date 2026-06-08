CREATE TABLE `payment_intents` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`wallet_id` text NOT NULL,
	`provider` text NOT NULL,
	`provider_reference` text,
	`channel` text NOT NULL,
	`amount` integer NOT NULL,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`checkout_url` text,
	`qr_string` text,
	`raw_payload` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`wallet_id`) REFERENCES `wallets`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `payment_intents_user_id_idx` ON `payment_intents` (`user_id`);--> statement-breakpoint
CREATE INDEX `payment_intents_wallet_id_idx` ON `payment_intents` (`wallet_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `payment_intents_provider_reference_unique` ON `payment_intents` (`provider_reference`);
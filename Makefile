# Consolidated Makefile for SV2 StarOS Project
# This Makefile builds all services except sv2-apps

# Define all service directories (excluding sv2-apps)
SERVICES := job-declaration-client pool translator

# Color output for better visibility
GREEN := \033[1;32m
CYAN := \033[1;36m
YELLOW := \033[1;33m
RED := \033[0;31m
RESET := \033[0m

.PHONY: all clean install check-deps check-init help $(SERVICES)
.PHONY: $(foreach service,$(SERVICES),$(service)-clean $(service)-install $(service)-build)
.DELETE_ON_ERROR:

# Function to get package ID for a service
define get_package_id
$(shell awk -F"'" '/id:/ {print $$2}' $(1)/startos/manifest.ts)
endef

# Function to build summary output for a service
define SUMMARY
	@manifest=$$(start-cli s9pk inspect $(1) manifest); \
	size=$$(du -h $(1) | awk '{print $$1}'); \
	title=$$(printf '%s' "$$manifest" | jq -r .title); \
	version=$$(printf '%s' "$$manifest" | jq -r .version); \
	arches=$$(printf '%s' "$$manifest" | jq -r '.hardwareRequirements.arch | join(", ")'); \
	sdkv=$$(printf '%s' "$$manifest" | jq -r .sdkVersion); \
	gitHash=$$(printf '%s' "$$manifest" | jq -r .gitHash | sed -E 's/(.*-modified)$$/$(RED)\1$(RESET)/'); \
	printf "\n"; \
	printf "$(GREEN)✅ Build Complete!$(RESET)\n"; \
	printf "\n"; \
	printf "$(RESET)📦 $$title$(RESET)   $(CYAN)v$$version$(RESET)\n"; \
	printf "───────────────────────────────\n"; \
	printf " $(CYAN)Filename:$(RESET)   %s\n" "$(1)"; \
	printf " $(CYAN)Size:$(RESET)       %s\n" "$$size"; \
	printf " $(CYAN)Arch:$(RESET)       %s\n" "$$arches"; \
	printf " $(CYAN)SDK:$(RESET)        %s\n" "$$sdkv"; \
	printf " $(CYAN)Git:$(RESET)        %s\n" "$$gitHash"; \
	echo ""
endef

# Default target: build all services
all: check-deps
	@echo "$(GREEN)Building all services...$(RESET)"
	@for service in $(SERVICES); do \
		echo "\n$(CYAN)━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$(RESET)"; \
		echo "$(CYAN)Building $$service...$(RESET)"; \
		echo "$(CYAN)━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$(RESET)"; \
		$(MAKE) --no-print-directory build-service SERVICE=$$service || exit 1; \
	done
	@echo "\n$(GREEN)✅ All services built successfully!$(RESET)\n"

# Help target
help:
	@echo "$(CYAN)SV2 StarOS Consolidated Makefile$(RESET)"
	@echo ""
	@echo "$(YELLOW)Available targets:$(RESET)"
	@echo "  make                          - Build all services (default)"
	@echo "  make clean                    - Clean all services"
	@echo "  make install                  - Install all services to StartOS"
	@echo "  make check-deps               - Check for required dependencies"
	@echo ""
	@echo "$(YELLOW)Service-specific targets:$(RESET)"
	@for service in $(SERVICES); do \
		echo "  make $$service                - Build $$service only"; \
		echo "  make $$service-clean          - Clean $$service only"; \
		echo "  make $$service-install        - Install $$service only"; \
	done
	@echo ""
	@echo "$(YELLOW)Architecture-specific builds:$(RESET)"
	@echo "  make <service>-aarch64        - Build for ARM64"
	@echo "  make <service>-x86_64         - Build for x86_64"
	@echo "  make <service>-arm            - Build for ARM (alias for aarch64)"
	@echo "  make <service>-x86            - Build for x86 (alias for x86_64)"
	@echo ""
	@echo "$(YELLOW)Services:$(RESET)"
	@for service in $(SERVICES); do \
		echo "  - $$service"; \
	done
	@echo ""

# Clean all services
clean:
	@echo "$(GREEN)Cleaning all services...$(RESET)"
	@for service in $(SERVICES); do \
		echo "$(CYAN)Cleaning $$service...$(RESET)"; \
		$(MAKE) --no-print-directory clean-service SERVICE=$$service; \
	done
	@echo "$(GREEN)✅ All services cleaned!$(RESET)"

# Install all services
install: check-deps check-init
	@echo "$(GREEN)Installing all services...$(RESET)"
	@for service in $(SERVICES); do \
		echo "\n$(CYAN)Installing $$service...$(RESET)"; \
		$(MAKE) --no-print-directory install-service SERVICE=$$service || exit 1; \
	done
	@echo "\n$(GREEN)✅ All services installed!$(RESET)\n"

# Check dependencies
check-deps:
	@command -v start-cli >/dev/null || \
		(echo "Error: start-cli not found. Please see https://docs.start9.com/latest/developer-guide/sdk/installing-the-sdk" && exit 1)
	@command -v npm >/dev/null || \
		(echo "Error: npm not found. Please install Node.js and npm." && exit 1)

# Check initialization
check-init:
	@if [ ! -f ~/.startos/developer.key.pem ]; then \
		echo "Initializing StartOS developer environment..."; \
		start-cli init; \
	fi

# Internal target to build a single service
.PHONY: build-service
build-service:
	@if [ -d sv2-apps ] && [ ! -d $(SERVICE)/sv2-apps ]; then echo "   Copying sv2-apps..."; cp -r sv2-apps $(SERVICE)/; fi
	@PACKAGE_ID=$$(awk -F"'" '/id:/ {print $$2}' $(SERVICE)/startos/manifest.ts); \
	BUILD=universal; \
	S9PK=$(SERVICE)/$${PACKAGE_ID}.s9pk; \
	cd $(SERVICE) && \
	echo "   Building node_modules..."; \
	if [ ! -d node_modules ]; then \
		npm ci > /dev/null 2>&1; \
	fi; \
	echo "   Building javascript..."; \
	npm run build > /dev/null 2>&1; \
	cd .. && \
	echo "   Re-evaluating ingredients..."; \
	cd $(SERVICE) && \
	INGREDIENTS=$$(start-cli s9pk list-ingredients 2>/dev/null); \
	cd .. && \
	for ingredient in $$INGREDIENTS; do \
		if [ ! -e $(SERVICE)/$$ingredient ]; then \
			echo "Missing ingredient: $$ingredient"; \
			exit 1; \
		fi; \
	done; \
	echo "   Packing '$${PACKAGE_ID}.s9pk'..."; \
	cd $(SERVICE) && BUILD=$$BUILD start-cli s9pk pack -o $${PACKAGE_ID}.s9pk && \
	manifest=$$(start-cli s9pk inspect $${PACKAGE_ID}.s9pk manifest 2>/dev/null); \
	size=$$(du -h $${PACKAGE_ID}.s9pk | awk '{print $$1}'); \
	title=$$(printf '%s' "$$manifest" | jq -r .title 2>/dev/null); \
	version=$$(printf '%s' "$$manifest" | jq -r .version 2>/dev/null); \
	arches=$$(printf '%s' "$$manifest" | jq -r '.hardwareRequirements.arch | join(", ")' 2>/dev/null); \
	sdkv=$$(printf '%s' "$$manifest" | jq -r .sdkVersion 2>/dev/null); \
	gitHash=$$(printf '%s' "$$manifest" | jq -r .gitHash 2>/dev/null | sed -E 's/(.*-modified)$$/$(RED)\1$(RESET)/'); \
	printf "\n"; \
	printf "$(GREEN)✅ Build Complete!$(RESET)\n"; \
	printf "\n"; \
	printf "$(RESET)📦 $$title$(RESET)   $(CYAN)v$$version$(RESET)\n"; \
	printf "───────────────────────────────\n"; \
	printf " $(CYAN)Filename:$(RESET)   %s\n" "$${PACKAGE_ID}.s9pk"; \
	printf " $(CYAN)Size:$(RESET)       %s\n" "$$size"; \
	printf " $(CYAN)Arch:$(RESET)       %s\n" "$$arches"; \
	printf " $(CYAN)SDK:$(RESET)        %s\n" "$$sdkv"; \
	printf " $(CYAN)Git:$(RESET)        %s\n" "$$gitHash"; \
	echo ""

# Internal target to clean a single service
.PHONY: clean-service
clean-service:
	@cd $(SERVICE) && \
	PACKAGE_ID=$$(awk -F"'" '/id:/ {print $$2}' startos/manifest.ts); \
	echo "   Cleaning up build artifacts..."; \
	rm -rf $${PACKAGE_ID}.s9pk $${PACKAGE_ID}_x86_64.s9pk $${PACKAGE_ID}_aarch64.s9pk javascript node_modules

# Internal target to install a single service
.PHONY: install-service
install-service:
	@cd $(SERVICE) && \
	PACKAGE_ID=$$(awk -F"'" '/id:/ {print $$2}' startos/manifest.ts); \
	BUILD=universal; \
	S9PK=$${PACKAGE_ID}.s9pk; \
	HOST=$$(awk -F'/' '/^host:/ {print $$3}' ~/.startos/config.yaml); \
	if [ -z "$$HOST" ]; then \
		echo "Error: You must define \"host: http://server-name.local\" in ~/.startos/config.yaml"; \
		exit 1; \
	fi; \
	echo "   🚀 Installing to $$HOST ..."; \
	start-cli package install -s $$S9PK

# Internal target to build a service for a specific architecture
.PHONY: build-service-arch
build-service-arch:
	@PACKAGE_ID=$$(awk -F"'" '/id:/ {print $$2}' $(SERVICE)/startos/manifest.ts); \
	S9PK=$(SERVICE)/$${PACKAGE_ID}_$(ARCH).s9pk; \
	cd $(SERVICE) && \
	echo "   Building node_modules..."; \
	if [ ! -d node_modules ]; then \
		npm ci > /dev/null 2>&1; \
	fi; \
	echo "   Building javascript..."; \
	npm run build > /dev/null 2>&1; \
	cd .. && \
	echo "   Re-evaluating ingredients..."; \
	cd $(SERVICE) && \
	INGREDIENTS=$$(start-cli s9pk list-ingredients 2>/dev/null); \
	cd .. && \
	for ingredient in $$INGREDIENTS; do \
		if [ ! -e $(SERVICE)/$$ingredient ]; then \
			echo "Missing ingredient: $$ingredient"; \
			exit 1; \
		fi; \
	done; \
	echo "   Packing '$${PACKAGE_ID}_$(ARCH).s9pk'..."; \
	cd $(SERVICE) && BUILD=$(ARCH) start-cli s9pk pack -o $${PACKAGE_ID}_$(ARCH).s9pk && \
	manifest=$$(start-cli s9pk inspect $${PACKAGE_ID}_$(ARCH).s9pk manifest 2>/dev/null); \
	size=$$(du -h $${PACKAGE_ID}_$(ARCH).s9pk | awk '{print $$1}'); \
	title=$$(printf '%s' "$$manifest" | jq -r .title 2>/dev/null); \
	version=$$(printf '%s' "$$manifest" | jq -r .version 2>/dev/null); \
	arches=$$(printf '%s' "$$manifest" | jq -r '.hardwareRequirements.arch | join(", ")' 2>/dev/null); \
	sdkv=$$(printf '%s' "$$manifest" | jq -r .sdkVersion 2>/dev/null); \
	gitHash=$$(printf '%s' "$$manifest" | jq -r .gitHash 2>/dev/null | sed -E 's/(.*-modified)$$/$(RED)\1$(RESET)/'); \
	printf "\n"; \
	printf "$(GREEN)✅ Build Complete!$(RESET)\n"; \
	printf "\n"; \
	printf "$(RESET)📦 $$title$(RESET)   $(CYAN)v$$version$(RESET)\n"; \
	printf "───────────────────────────────\n"; \
	printf " $(CYAN)Filename:$(RESET)   %s\n" "$${PACKAGE_ID}_$(ARCH).s9pk"; \
	printf " $(CYAN)Size:$(RESET)       %s\n" "$$size"; \
	printf " $(CYAN)Arch:$(RESET)       %s\n" "$$arches"; \
	printf " $(CYAN)SDK:$(RESET)        %s\n" "$$sdkv"; \
	printf " $(CYAN)Git:$(RESET)        %s\n" "$$gitHash"; \
	echo ""

# Individual service targets
$(SERVICES): check-deps
	@echo "$(CYAN)Building $@...$(RESET)"
	@$(MAKE) --no-print-directory build-service SERVICE=$@

# Service-specific clean targets
define SERVICE_CLEAN_TARGET
$(1)-clean:
	@echo "$(CYAN)Cleaning $(1)...$(RESET)"
	@$$(MAKE) --no-print-directory clean-service SERVICE=$(1)
endef
$(foreach service,$(SERVICES),$(eval $(call SERVICE_CLEAN_TARGET,$(service))))

# Service-specific install targets
define SERVICE_INSTALL_TARGET
$(1)-install: check-deps check-init
	@echo "$(CYAN)Installing $(1)...$(RESET)"
	@$$(MAKE) --no-print-directory build-service SERVICE=$(1)
	@$$(MAKE) --no-print-directory install-service SERVICE=$(1)
endef
$(foreach service,$(SERVICES),$(eval $(call SERVICE_INSTALL_TARGET,$(service))))

# Architecture-specific targets for each service
define SERVICE_ARCH_TARGETS
$(1)-aarch64: check-deps
	@echo "$$(CYAN)Building $(1) for aarch64...$$(RESET)"
	@$$(MAKE) --no-print-directory build-service-arch SERVICE=$(1) ARCH=aarch64

$(1)-x86_64: check-deps
	@echo "$$(CYAN)Building $(1) for x86_64...$$(RESET)"
	@$$(MAKE) --no-print-directory build-service-arch SERVICE=$(1) ARCH=x86_64

$(1)-arm: check-deps
	@echo "$$(CYAN)Building $(1) for arm (aarch64)...$$(RESET)"
	@$$(MAKE) --no-print-directory build-service-arch SERVICE=$(1) ARCH=aarch64

$(1)-x86: check-deps
	@echo "$$(CYAN)Building $(1) for x86 (x86_64)...$$(RESET)"
	@$$(MAKE) --no-print-directory build-service-arch SERVICE=$(1) ARCH=x86_64

.PHONY: $(1)-aarch64 $(1)-x86_64 $(1)-arm $(1)-x86
endef

# Generate architecture targets for all services
$(foreach service,$(SERVICES),$(eval $(call SERVICE_ARCH_TARGETS,$(service))))

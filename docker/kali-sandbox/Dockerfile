# RudraX Kali Linux Sandbox
# Minimal Kali image with essential security & dev tools
# Used by RudraX agents for sandboxed tool execution

FROM kalilinux/kali-rolling:latest

LABEL maintainer="RudraX" \
      description="RudraX Kali Sandbox — Minimal Kali with security tools" \
      version="1.0"

# Avoid interactive prompts
ENV DEBIAN_FRONTEND=noninteractive
ENV TERM=xterm-256color
ENV TZ=UTC

# Update and install minimal toolset
RUN apt-get update && apt-get upgrade -y && \
    apt-get install -y --no-install-recommends \
    # Core utilities
    ca-certificates \
    curl \
    wget \
    netcat-openbsd \
    nmap \
    # Network tools
    net-tools \
    dnsutils \
    iputils-ping \
    iproute2 \
    tcpdump \
    # Web tools
    nikto \
    dirb \
    gobuster \
    whatweb \
    # Password/Hash
    hashcat \
    john \
    # Exploitation framework
    metasploit-framework \
    # Wireless
    aircrack-ng \
    # Forensics
    binwalk \
    foremost \
    # Reverse engineering
    radare2 \
    # Info gathering
    theharvester \
    sublist3r \
    # Sniffing/Spoofing
    wireshark \
    Ettercap-graphical \
    # Scripting
    python3 \
    python3-pip \
    python3-venv \
    ruby \
    gcc \
    make \
    # Version control
    git \
    # SSH client
    openssh-client \
    # Text processing
    jq \
    xmlstarlet \
    # Archive tools
    unzip \
    p7zip-full \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user for sandboxed execution
RUN groupadd -g 1001 rudrax && \
    useradd -u 1001 -g rudrax -m -s /bin/bash rudrax && \
    mkdir -p /home/rudrax/workspace && \
    chown -R rudrax:rudrax /home/rudrax

# Working directory
WORKDIR /home/rudrax/workspace

# Health check
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD echo "alive" | nc -w 2 localhost 2222 || exit 1

# SSH server for RudraX to connect and execute commands
RUN apt-get update && apt-get install -y --no-install-recommends openssh-server && \
    apt-get clean && rm -rf /var/lib/apt/lists/* && \
    mkdir -p /run/sshd && \
    echo "rudrax:rudrax" | chpasswd && \
    echo "PermitRootLogin no" >> /etc/ssh/sshd_config && \
    echo "PasswordAuthentication yes" >> /etc/ssh/sshd_config && \
    echo "AllowUsers rudrax" >> /etc/ssh/sshd_config

# Copy entrypoint
COPY --chmod=755 entrypoint.sh /entrypoint.sh

EXPOSE 2222

ENTRYPOINT ["/entrypoint.sh"]
CMD ["shell"]
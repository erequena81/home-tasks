FROM node:18-alpine
WORKDIR /app
COPY server.js .
RUN mkdir -p public
COPY public/ public/
EXPOSE 3000
CMD ["node", "server.js"]

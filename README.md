# CordovaServer
A Cordova development http server built on live-server. It runs pure Javascript based cordova projects in the browser without the need to add any platforms to your project.

It is based on the excellent [live-server](https://github.com/tapio/live-server).

Simple run it from your Cordova project's root folder (i.e. the folder where the config.xml is located):

```sh
<CORDOVA_PROJECT>/cordova-server
```
# Main features

  * simple and light-weight
  * automatically resolves Cordova project level plugin dependencies in your browser
  * automatically runs the application from your Cordova project level WWW folder
  * auto reloads changes to the browsers: you can develop the JS plugins and the app at the same time
  * no need to add or have any specific Cordova platforms, no need to make 'cordova prepare' calls at all

# Prerequisites

  * You have installed Cordova on your machine:
```sh
npm install -g cordova
```
  * You Have a Cordova project to work on. To do this you can do the followings:
```sh
cordova create -d <MY_PROJECT> com.myhomepage <MY_PROJECT>
# you can also add any JS plugins now or later:
cordova plugin add <com.plugin.i.want.to.use>
```
  * Simply grab a copy of [cordova.js](https://github.com/apache/cordova-js/blob/master/src/cordova.js) and place it under the WWW folder of your Cordova project. This is a temp approach in this version.

# Limitation

  * currently runs Cordova apps that depend only on pure Javascript based plugins

# Inspiration

TODO extend and shape the below description:

With live-server you are able to run WWW applications and sites with automatic reload.
In case of Cordova projects however you have to somehow load the Cordova plugins in its special module definitions, which are usually not in its source coden and gets only generated once after you added a platform and called the prepare command of cordova.
It fastens the developmnet of the UI, protyping with dependencies resolution.
In case you are also developing a pure JS plugin, that depends only on other pure JS plugins or libraries, you can easily setup a Cordova project to test and develop at once, from the same source code.


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

# Limitation

  * currently tested on Cordova apps that depend only on pure Javascript based plugins

# Inspiration

Have an easy platform agnostic way to create and rapid develop HTML based frontend for Cordova projects.

Have an easy platform agnostic way to test pure Javascript based Cordova plugins.

With live-server you are able to run WWW applications and sites with automatic reload. Why not to achieve this in case of Cordova projects.

In case of Cordova projects you the Cordova plugins gets loaded in its special Javascript/Cordova module definitions, which are usually a wrapped versions of the original plugin source files. These are only generated once after you added a specific platform (e.g. cordova platform add android) and called the 'cordova prepare' command. This is repetitive and unecessary task, that can be avoided.  

It fastens the developmnet of the UI, protyping with automatically resolving Cordova plugin dependencies.

In case you are also developing a pure JS plugin, that depends only on other pure JS plugins or libraries, you can easily setup a Cordova project to test and develop at once, from the same source code.

# Changes

  - Version 0.0.3
  
  cordova.js automatically obtained when installing from npm (prepublish script added, index.js modified to serve the new obtained cordova.js)

  bug fix (plugin.xml with no js modules defined parsed now properly)

  cleanup (trailing spaces)
  

  - Version 0.0.1 / 0.0.2

  first version




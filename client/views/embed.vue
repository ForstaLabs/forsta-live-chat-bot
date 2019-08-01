<template lang="html">
  <div class="ui container left aligned" v-if="embedSettings">
    <sui-grid>
      <sui-grid-row>
        <sui-grid-column>
          <sui-button 
            color="blue"
            style="width:100%"
            @click="saveChanges()"
            v-if="changesMade">Save Changes</sui-button>
        </sui-grid-column>
      </sui-grid-row>
      <sui-grid-row :columns="2">
        <sui-grid-column>
          <sui-segment inverted color="blue" v-if="codeCopied">Copied!</sui-segment>
          <textarea id="codeTextarea" readonly="true" :value="embedCode" class="textarea" />
          <sui-button style="width:100%" color="blue" @click="copyEmbedCode()">Copy</sui-button>

          <div class="label">Title</div>
          <sui-input
            style="width:100%"
            v-model="embedSettings.title"
            :value="embedSettings.title"
            @input="checkForChanges()"
          />

          <div class="label">Subtitle</div>
          <sui-input
            style="width:100%"
            v-model="embedSettings.subtitle"
            :value="embedSettings.subtitle"
            @input="checkForChanges()"
          />

          <div class="label">Form Text</div>
          <sui-input
            style="width:100%"
            v-model="embedSettings.formText"
            :value="embedSettings.formText"
            @input="checkForChanges()"
          />

          <div class="label">Header Logo URL</div>
          <sui-input
            style="width:100%"
            v-model="embedSettings.headerLogoUrl"
            :value="embedSettings.headerLogoUrl"
            @input="checkForChanges()"
          />

          <table>
            <tr>
              <td>
                <div class="label">Header BG Color</div>
                <sui-input
                  style="display:inline !important"
                  type="color"
                  class="color-picker"
                  v-model="embedSettings.headerBackgroundColor"
                  :value="embedSettings.headerBackgroundColor"
                  @input="checkForChanges()"
                />
              </td>
              <td style="padding-left:20px">
                <div class="label">Header Font Color</div>
                <sui-input
                  type="color"
                  class="color-picker"
                  v-model="embedSettings.headerFontColor"
                  :value="embedSettings.headerFontColor"
                  @input="checkForChanges()"
                />
              </td>
            </tr>
          </table>

          <div class="label">Button Text</div>
          <sui-input
            style="width:100%"
            v-model="embedSettings.buttonText"
            @input="checkForChanges()"
          />

          <table>
            <tr>
              <td>
                <div class="label">Button Color</div>
                <sui-input
                  type="color"
                  class="color-picker"
                  :value="embedSettings.buttonBackgroundColor"
                  v-model="embedSettings.buttonBackgroundColor"
                  @input="checkForChanges()"
                />
              </td>
              <td style="padding-left:45px">
                <div class="label">Button Font Color</div>
                <sui-input
                  type="color"
                  class="color-picker"
                  v-model="embedSettings.buttonFontColor"
                  :value="embedSettings.buttonFontColor"
                  @input="checkForChanges()"/>
              </td>
            </tr>
          </table>

          
          <div class="label">Open Button Icon URL</div>
          <sui-input
            style="width:100%"
            v-model="embedSettings.openButtonIconUrl"
            :value="embedSettings.openButtonIconUrl"
            @input="checkForChanges()"/>

          <div class="label">Open Button Tooltip Text</div>
          <sui-input
            style="width:100%"
            v-model="embedSettings.openButtonTooltipText"
            @input="checkForChanges()"/>

          <div class="label">Open Button Color</div>
          <sui-input
            type="color"
            class="color-picker"
            v-model="embedSettings.openButtonColor"
            @input="checkForChanges()"/>

          <div class="label">Allow Calling?</div>
          <sui-checkbox
            v-model="embedSettings.allowCalling"
            @input="checkForChanges()"/>
          <br>
        </sui-grid-column>
        <sui-grid-column>
          <div id="forsta-chat-header" class="mdl-shadow--2dp" :style="getHeaderStyling()">
            <table>
              <tr>
                <td>
                  <img style="padding:15px" height="120" width="120" :src="embedSettings.headerLogoUrl">
                </td>
                <td style="padding-left:10px;padding-top:10px !important">
                  <p class="forsta-chat-header-title">{{embedSettings.title}}</p>
                  <p class="forsta-chat-header-subtitle">{{embedSettings.subtitle}}</p>
                </td>
              </tr>
            </table>
          </div>
          
          <div class="forsta-chat" id="forsta-chat" style="text-align:left; ">
            <div class="forsta-form" id="forsta-form">
              <div style="margin-bottom:10px;">{{embedSettings.formText}}</div>
              <div class="label">First Name</div>
              <sui-input label="First Name" maxlength="20" style="width:80%"></sui-input>
              <div class="label">Last Name</div>
              <sui-input maxlength="20" style="width:80%;"></sui-input>
              <div class="label">Email</div>
              <sui-input maxlength="20" style="width:80%;"></sui-input>
              <div style="margin-bottom:50px"></div>
              <sui-button
                style="width:80%;font-size:1.2em"
                :style="getButtonStyling()"
              >{{embedSettings.buttonText}}</sui-button>
            </div>
          </div>

          <a class="forsta-chat-btn" id="forsta-chat-desktop" :style="getOpenButtonStyling()">
            <img id="chat-open" width="40" :src="embedSettings.openButtonIconUrl">
          </a>
        </sui-grid-column>
      </sui-grid-row>
    </sui-grid>

    <div>
      <sui-modal v-model="showingSaveChangesModal">
          <sui-modal-header>Save Changes</sui-modal-header>
          <sui-modal-content>
              <sui-modal-description>
                  <sui-header>Continue without saving changes?</sui-header>
                  <p>Your changes have not been saved.</p>
              </sui-modal-description>
          </sui-modal-content>
          <sui-modal-actions style="padding:10px">
              <sui-button 
                  class="yellow" 
                  floated="left"
                  @click="showingSaveChangesModal = false"
                  content="Cancel" />
              <sui-button 
                  class="red"
                  @click="nextRoute()"
                  content="Don't Save & Continue" />
              <sui-button 
                  floated="right" 
                  class="blue" 
                  @click="saveAndContinue()"
                  content="Save & Continue" />
          </sui-modal-actions>
      </sui-modal>
    </div>
  </div>
</template>

<script>
"use strict";
const util = require("../util");
const shared = require("../globalState");

module.exports = {
  data() {
    return {
      global: shared.state,
      changesMade: false,
      embedSettings: null,
      embedSettingsOriginal: "",
      showingSaveChangesModal: false,
      nextRoute: null,
      codeCopied: false
    };
  },
  mounted() {
    this.loadData();
  },
  computed: {
    embedCode() {
      const {
        title,
        subtitle,
        formText, 
        headerLogoUrl,
        headerBackgroundColor,
        headerFontColor,
        buttonText,
        buttonBackgroundColor,
        buttonFontColor,
        openButtonIconUrl,
        openButtonTooltipText,
        openButtonColor,
        allowCalling,
        token,
        tag
      } = this.embedSettings;
      return `<script type="text/javascript" src="${window.location.origin}/embed.js"><\/script>
<script type="text/javascript">
  window.onload = function() {
    flc.options = {
      title: "${title}",
      subtitle: "${subtitle}",
      formText: "${formText}",
      headerLogoUrl: "${headerLogoUrl}",
      headerBackgroundColor: "${headerBackgroundColor}",
      headerFontColor: "${headerFontColor}",
      buttonText: "${buttonText}",
      buttonBackgroundColor: "${buttonBackgroundColor}",
      buttonFontColor: "${buttonFontColor}",
      openButtonIconUrl: "${openButtonIconUrl}",
      openButtonTooltipText: "${openButtonTooltipText}",
      openButtonColor: "${openButtonColor}",
      allowCalling: "${allowCalling}",
      forceScreenShare: "false",
      token: "${token}",
      tag: "${tag}",
    };
    flc.activate();
  }
<\/script>`;
    }
  },
  methods: {
    copyEmbedCode () {
      document.getElementById("codeTextarea").select();
      document.execCommand('copy');
      this.codeCopied = true;
      setTimeout(() => this.codeCopied = false, 2000);
      
    },
    checkForChanges() {
      if (JSON.stringify(this.embedSettings) != this.embedSettingsOriginal) {
        this.changesMade = true;
      } else {
        this.changesMade = false;
      }
    },
    loadData() {
      util.fetch
        .call(this, "/api/embedSettings/", { method: "get" })
        .then(result => {
          this.embedSettingsOriginal = JSON.stringify(result.theJson);
          this.embedSettings = result.theJson;
        })
        .catch(err => console.log(err));
    },
    saveAndContinue() {
      this.saveData();
      this.nextRoute();
    },
    getHeaderStyling() {
      return `background-color:${
        this.embedSettings.headerBackgroundColor
      };
      color:${this.embedSettings.headerFontColor}`;
    },
    getButtonStyling() {
      return `background-color:${
        this.embedSettings.buttonBackgroundColor
      };
      color:${this.embedSettings.buttonFontColor}`;
    },
    getOpenButtonStyling() {
      return `background-color:${
        this.embedSettings.openButtonColor
      }`;
    },
    saveChanges() {
      const op = { method: "post", body: { embedSettings: this.embedSettings } };
      util.fetch.call(this, "/api/embedSettings/", op)
      this.embedSettingsOriginal = JSON.stringify(this.embedSettings);
      this.changesMade = false;
      //   .catch(err => console.log(err));
      // util.fetch.call(this, "/api/embedSettings/", op).then(result => {
      //   console.log(result);
      //   this.embedSettingsOriginal = JSON.stringify(this.embedSettings);
      //   this.changesMade = false;
      // })
    }
  },
  beforeRouteLeave(to, from, next) {
    if (this.changesMade) {
      this.showingSaveChangesModal = true;
      this.nextRoute = next;
      next(false);
    } else {
      next();
    }
  },
};
</script>

<style>
.textarea {
  padding: 5px;
  border-radius: 6px;
  border: 1px #ddd solid;
  width: 100%;
  min-height: 250px;
  font-family: monospace;
}
div [class*="pull left"] {
  float: left;
  margin-left: 0.25em;
}

div [class*="pull right"] {
  float: right;
  margin-right: 0.25em;
}

.flexbox {
  display: flex;
  flex: 1;
  margin-right: 0.5em;
}

.color-picker input[type="color"] {
  height: 40px;
  width: 70px;
  vertical-align: middle;
}

.label {
  color: #555;
  margin-bottom: 3px;
  margin-top: 5px;
  font-weight: 750;
}

.response-item {
  padding: 5px 15px 15px 15px;
  border: 1px #d0d0d0 solid;
  margin: 15px 0px 15px 0px;
  border-radius: 5px;
}

#chat-open {
  margin-top: 13px;
}
.forsta-chat {
  z-index: 1000;
  width: 400px;
  height: 400px;
  background-color: #ffffff;
  border-radius: 0px 0px 10px 10px;
}
.forsta-chat-btn {
  z-index: 1000;
  cursor: pointer;
  outline: none;
  display: inline-block;
  width: 65px;
  height: 65px;
  border-radius: 50%;
  text-align: center;
}
#forsta-chat-header {
  z-index: 1000;
  width: 402px;
  height: 148px;
  background-position: top center;
  background-size: cover;
  background-repeat: no-repeat;
  border-radius: 10px 10px 0px 0px;
}
.forsta-form {
  padding-top: 20px;
  text-align: center;
}
.forsta-chat-header-title {
  font-size: 2em;
  font-weight: bold;
  margin-bottom: 5px !important;
  margin-top: 5px !important;
  margin-left: 15px;
}
.forsta-chat-header-subtitle {
  font-size: 1.2em;
  font-weight: bold;
  margin-top: 0px !important;
  margin-left:15px !important;
}
</style>
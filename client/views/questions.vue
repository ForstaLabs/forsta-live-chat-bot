<style>
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
  display: block;
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
</style>
 
<template lang="html">
    <div class="ui container left aligned">
        <sui-segment v-for="question in questions" style="background-color:#fafafa">
            <sui-grid>
                <sui-grid-row
                    :columns="2">
                    <sui-grid-column>
                        <h2>Question {{questions.indexOf(question)+1}}</h2>
                    </sui-grid-column>
                    <sui-grid-column>
                        <sui-button
                            class="pull right"
                            color="red"
                            icon="trash"
                            @click="deleteQuestion(question)" />
                        <sui-button
                            class="pull right"
                            color="grey"
                            icon="arrow down"
                            @click="moveQuestionDown(question)" />
                        <sui-button
                            class="pull right"
                            color="grey"
                            icon="arrow up"
                            @click="moveQuestionUp(question)" />
                    </sui-grid-column>
                </sui-grid-row>

                <sui-grid-row style="padding:0px">
                    <sui-grid-column>
                        <span class="label">Prompt</span>
                        <sui-input
                          fluid
                          :style="$mq | mq({
                              smallScreen: 'width:50%',
                              bigScreen: 'width:70%'})"
                          v-model="question.prompt"
                          :value="question.prompt"
                          @input="checkForChanges()"/>
                    </sui-grid-column>
                </sui-grid-row>

                <sui-grid-row style="padding:0px">
                    <sui-grid-column>
                        <span class="label">Type</span>
                        <sui-dropdown
                            selection
                            placeholder="Question Type"
                            :options="questionTypes"
                            @input="checkForChanges()"
                            v-model="question.type" />
                    </sui-grid-column>
                </sui-grid-row>

                <sui-grid-row v-if="question.type==='Multiple Choice'">
                    <sui-grid-column>
                        <div v-for="response in question.responses" class="response-item">
                            <span class="label">Response Text</span>
                            <sui-input
                                style="width:100%"
                                class="flexbox"
                                v-model="response.text"
                                :value="response.text"
                                @input="checkForChanges()"/>                          
                            <span class="label">Action</span>
                            <sui-dropdown      
                                selection
                                :options="questionActions"
                                v-model="response.action"
                                @input="updateAction(response)"/>
                            <sui-icon
                                name="arrow right"
                                size="large"
                                style="font-weight:100" />
                            <span v-if="response.action==='Forward to Question'">
                                <sui-dropdown   
                                    selection
                                    placeholder="Question"
                                    :options="questionsForDropdown"
                                    v-model="response.actionOption"
                                    @input="checkForChanges()"/>
                            </span>
                            <span v-if="response.action==='Forward to Tag'">
                                <sui-dropdown
                                  search
                                  selection
                                  placeholder="@user.tag"
                                  :options="tagsForDropdown"   
                                  :value="response.actionOption"
                                  v-model="response.actionOption"
                                  @input="updateTagData(response)" />
                            </span>
                            <sui-dropdown
                              selection
                              :options="colorPresets"   
                              :value="getColorPresetValue(response.color)"
                              @input="value => updateResponseColor(value, response)" />                               
                            <sui-input
                                type="color"
                                class="color-picker"
                                :value="response.color"
                                v-model="response.color"
                                @input="checkForChanges()"/>  
                            <sui-button 
                                color="red"
                                class="pull right"
                                icon="trash alternate outline"
                                style="vertical-align:middle"
                                @click="deleteResponse(question, response)" />
                        </div>
                    <sui-button
                        style="margin-top:25px"
                        color="blue"
                        content="Add Response"
                        @click="newResponse(question)"
                        v-if="question.type==='Multiple Choice'"/>
                    </sui-grid-column>
                </sui-grid-row>
                
                <sui-grid-row
                    class="left aligned"
                    v-if="question.type==='Free Response'">
                    <sui-grid-column>
                        <span class="label">Action</span>
                        <sui-dropdown      
                            selection
                            :options="questionActions"
                            v-model="question.responses[0].action"
                            @input="updateAction(question.responses[0].action)"/>
                        <sui-icon
                            name="arrow right"
                            size="large" />
                        <span v-if="question.responses[0].action==='Forward to Question'">
                            <sui-dropdown   
                                selection
                                placeholder="Question"
                                :options="questionsForDropdown"
                                v-model="question.responses[0].actionOption"
                                @input="checkForChanges()"/>
                        </span>
                        <span v-if="question.responses[0].action==='Forward to Tag'">
                            <sui-dropdown
                              :options="tagsForDropdown"   
                              :value="question.responses[0].actionOption"
                              v-model="question.responses[0].actionOption"
                              @input="updateTagData(question.responses[0])"/>
                        </span>
                    </sui-grid-column>
                </sui-grid-row>

                <sui-grid-row
                    class="left aligned"
                    v-if="question.type==='End Question'">
                    <sui-grid-column>
                      <sui-segment basic>
                        This will end the chat session.
                      </sui-segment>
                    </sui-grid-column>
                </sui-grid-row>
            </sui-grid>
        </sui-segment>

        <div style="margin-bottom:100px">
            <sui-divider />
            <sui-button
                class="ui large blue button pull left"
                content="New Question"
                @click="newQuestion()" />

            <sui-button
                class="ui large black button pull right"
                content="Save Changes" 
                @click="saveData()"
                v-if="changesMade" />
        </div>

        <div>
            <sui-modal v-model="showingSaveChangesModal">
              <sui-modal-header>Continue without saving changes?</sui-modal-header>
              <sui-modal-content>
                  <sui-modal-description>
                      <p>Your changes have not been saved.</p>
                  </sui-modal-description>
              </sui-modal-content>
              <sui-modal-actions style="padding:10px">
                  <sui-button 
                      class="black" 
                      @click="showingSaveChangesModal = false"
                      content="Cancel" />
                  <sui-button 
                      class="gray"
                      @click="nextRoute()"
                      content="Don't Save & Continue" />
                  <sui-button 
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
  mounted() {
    this.loadData();
  },
  methods: {
    getColorPresetValue (hexColor) {
      let presetColor = this.colorPresets.find(c => c.value == hexColor);
      if (presetColor) {
        return presetColor.value;
      } else {
        return "Custom";
      }
    },
    updateResponseColor (value, response) {
      response.color = value;
      this.checkForChanges();
    },
    checkForChanges() {
      if (this.changesMade) return;
      if (JSON.stringify(this.questions) !== this.questionsOriginal) {
        this.changesMade = true;
      }
    },
    deleteResponse(question, response) {
      question.responses.splice(question.responses.indexOf(response), 1);
      this.changesMade = true;
    },
    deleteQuestion(question) {
      this.questions.splice(this.questions.indexOf(question), 1);
      this.questionsForDropdown.splice(this.questions.indexOf(question), 1);
      this.changesMade = true;
    },
    loadData() {
      util.fetch
        .call(this, "/api/questions/", { method: "get" })
        .then(result => {
          this.questionsOriginal = JSON.stringify(result.theJson);
          this.questions = result.theJson;
          this.questionsForDropdown = [];
          for (let i = 0; i < this.questions.length; i++) {
            this.questionsForDropdown.push({
              text: `Question ${i + 1}`,
              value: `Question ${i + 1}`
            });
          }
        });

      util.fetch.call(this, "/api/tags/", { method: "get" }).then(result => {
        this.tags = result.theJson.tags;
        this.tagsForDropdown = result.theJson.tags.map(t => {
          return { text: `@${t.slug}`, value: `@${t.slug}` };
        });
      });
    },
    moveQuestionDown(question) {
      const i = this.questions.indexOf(question);
      if (i >= this.questions.length - 1) return;
      const temp = this.questions[i + 1];
      this.questions.splice(i + 1, 1, question);
      this.questions.splice(i, 1, temp);
      this.checkForChanges();
    },
    moveQuestionUp(question) {
      const i = this.questions.indexOf(question);
      if (i <= 0) return;
      const temp = this.questions[i - 1];
      this.questions.splice(i - 1, 1, question);
      this.questions.splice(i, 1, temp);
      this.checkForChanges();
    },
    newQuestion() {
      this.questions.push({
        prompt: "Question Prompt",
        type: "Multiple Choice",
        responses: [
          {
            text: "Yes",
            action: "Forward to Question",
            actionOption: "Question 1",
            tagId: null,
            color: "#ffffff"
          },
          {
            text: "No",
            action: "Forward to Question",
            actionOption: "Question 1",
            tagId: null,
            color: "#ffffff"
          }
        ]
      });
      this.questionsForDropdown.push({
        text: `Question ${this.questions.length}`,
        value: `Question ${this.questions.length}`
      });
      this.changesMade = true;
    },
    newResponse(question) {
      question.responses.push({
        text: "New Response",
        action: "Forward to Question",
        actionOption: `Question ${this.questions.indexOf(question) + 1}`,
        distId: null,
        color: "#0E6EB8"
      });
      this.changesMade = true;
    },
    saveAndContinue() {
      this.saveData();
      this.nextRoute();
    },
    saveData() {
      util.fetch("/api/questions/", {
        method: "post",
        body: { questions: this.questions }
      });
      this.changesMade = false;
      this.questionsOriginal = JSON.stringify(this.questions);
    },
    updateAction(response) {
      response.actionOption = "";
      if (response.action === "Forward to Question") {
        response.actionOption = "Question 1";
      }
      this.checkForChanges();
    },
    updateTagData(response) {
      const responseTag =
        response.actionOption.charAt(0) == "@"
          ? response.actionOption.slice(1, response.actionOption.length)
          : response.actionOption;
      this.checkForChanges();c
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
  data() {
    return {
      global: shared.state,
      changesMade: false,
      questions: [],
      questionsOriginal: [],
      questionsForDropdown: [],
      showingSaveChangesModal: false,
      nextRoute: null,
      tags: [],
      tagsForDropdown: [],
      questionActions: [
        {
          text: "Forward to Question",
          value: "Forward to Question"
        },
        {
          text: "Forward to Tag",
          value: "Forward to Tag"
        }
      ],
      questionTypes: [
        {
          text: "Free Response",
          value: "Free Response"
        },
        {
          text: "Multiple Choice",
          value: "Multiple Choice"
        },
        {
          text: "End Question",
          value: "End Question"
        }
      ],
      colorPresets: [
        {
          text: "Red",
          value: "#B03060"
        },
        {
          text: "Orange",
          value: "#FE9A76"
        },
        {
          text: "Yellow",
          value: "#FFD700"
        },
        {
          text: "Olive",
          value: "#32CD32"
        },
        {
          text: "Green",
          value: "#016936"
        },
        {
          text: "Teal",
          value: "#008080"
        },
        {
          text: "Blue",
          value: "#0E6EB8"
        },
        {
          text: "Violet",
          value: "#EE82EE"
        },
        {
          text: "Purple",
          value: "#B413EC"
        },
        {
          text: "Pink",
          value: "#FF1493"
        },
        {
          text: "Brown",
          value: "#A52A2A"
        },
        {
          text: "Gray",
          value: "#A0A0A0"
        },
        {
          text: "Black",
          value: "#000000"
        },
        {
          text: "Custom", 
          value: "Custom"
        }
      ]
    };
  }
};
</script>
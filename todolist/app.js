//jshint esversion: 6
const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const _ = require("lodash");
const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");

mongoose.connect("mongodb://localhost:27017/todolistDB");

const itemSchema = mongoose.Schema({
    name: String,
});
const Item = mongoose.model("Item", itemSchema);
const item1 = new Item({
    name: "Wake up",
});
const item2 = new Item({
    name: "Workout",
});
const item3 = new Item({
    name: "Bath",
});
const defaultItems = [item1, item2, item3];
const listSchema = mongoose.Schema({
    name: String,
    items: [itemSchema],
});
const List = mongoose.model("List", listSchema);

app.get("/", function(req, res) {
    Item.find({}, function(err, foundItems) {
        if (foundItems.length === 0) {
            Item.insertMany(defaultItems, function(err) {
                if (err) {
                    console.log(err);
                } else {
                    console.log("Succesfully saved default item to DB.");
                }
            });
            res.redirect("/");
        } else {
            res.render("list", {
                listTitle: "Today",
                newListItems: foundItems,
            });
        }
    });
});
app.get("/:customListName", function(req, res) {
    const customListName = _.capitalize(req.params.customListName);
    // console.log(customListName);
    List.findOne({ name: customListName }, function(err, foundList) {
        if (!err) {
            if (foundList) {
                res.render("list", {
                    listTitle: foundList.name,
                    newListItems: foundList.items,
                });
                console.log("Exist previously ");
            } else {
                const list = new List({
                    name: customListName,
                    items: defaultItems,
                });
                list.save();
                res.redirect("/" + customListName);
                console.log("Does not exist previously");
            }
        }
    });
});
app.post("/", function(req, res) {
    const itemName = req.body.newItem;
    const listName = req.body.list;
    const item = new Item({
        name: itemName,
    });
    if (listName === "Today") {
        console.log(listName);
        item.save();
        res.redirect("/");
    } else {
        List.findOne({ name: listName }, function(err, foundlist) {
            if (foundlist) {
                foundlist.items.push(item);
                foundlist.save();
                console.log(listName);
                res.redirect("/" + listName);
            }
        });
    }
});
app.post("/delete", function(req, res) {
    const checked_id = req.body.checkbox;
    const listName = req.body.hidden;
    console.log(checked_id);
    console.log(listName);
    if (listName === "Today") {
        Item.findByIdAndDelete(checked_id, function(err) {
            if (err) {
                console.log(err);
            } else {
                console.log(`Successfully deleted ${checked_id}`);
                res.redirect("/");
            }
        });
    } else {
        List.findOneAndUpdate({ name: listName }, {
                $pull: { items: { _id: checked_id } },
            },
            function(err, results) {
                if (!err) {
                    console.log("Succesfully deleted ");
                    res.redirect("/" + listName);
                }
            }
        );
    }
});

app.listen(process.env.PORT || 3000, function() {
    console.log("Port 3000 is running");
});
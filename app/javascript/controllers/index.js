// app/javascript/controllers/index.js
import { application } from "./application";
import { eagerLoadControllersFrom } from "@hotwired/stimulus-loading";

// Eager load all controllers defined in the import map under controllers/*
eagerLoadControllersFrom("controllers", application);

// Lazy load controllers as they appear in the DOM (remember not to preload controllers in import map!)
// import { lazyLoadControllersFrom } from "@hotwired/stimulus-loading"
// lazyLoadControllersFrom("controllers", application)
